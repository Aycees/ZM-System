import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { STANDARD_HOURS_PER_DAY, HALF_DAY_HOURS_CAP, MAX_HOURS_PER_DAY } from '@zm/shared';
import { LogAttendanceDto, ClockOutDto, UpdateAttendanceDto } from './dto';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async findAll(params?: { employeeId?: string; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number }) {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params?.employeeId) where.employeeId = params.employeeId;
    if (params?.dateFrom || params?.dateTo) {
      where.date = {};
      // Use UTC dates to avoid timezone shifting
      if (params?.dateFrom) where.date.gte = new Date(params.dateFrom + 'T00:00:00.000Z');
      if (params?.dateTo) where.date.lte = new Date(params.dateTo + 'T00:00:00.000Z');
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
        include: { employee: { select: { id: true, fullName: true, position: true } } },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /** Returns [startOfToday, startOfTomorrow] anchored to Philippine Time (UTC+8). */
  private getPHTTodayRange(): [Date, Date] {
    const phtNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const dateStr = phtNow.toISOString().split('T')[0]; // 'YYYY-MM-DD' in PHT
    const today = new Date(dateStr + 'T00:00:00.000Z');
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return [today, tomorrow];
  }

  async getToday() {
    const [today, tomorrow] = this.getPHTTodayRange();

    return this.prisma.attendance.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
      },
      include: { employee: { select: { id: true, fullName: true, position: true } } },
      orderBy: { timeIn: 'asc' },
    });
  }

  async logClockIn(dto: LogAttendanceDto, performedBy: string) {
    // TIMEZONE FIX: Parse date as UTC to prevent day shift
    const dateStr = dto.date || new Date().toISOString().split('T')[0];
    const attendanceDate = new Date(dateStr + 'T00:00:00.000Z');

    // Check for duplicate attendance on the same date
    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: dto.employeeId,
          date: attendanceDate,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Attendance already logged for this employee on this date');
    }

    // Verify employee exists and is active
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee || employee.status !== 'ACTIVE') {
      throw new BadRequestException('Employee not found or is not active');
    }

    const timeIn = new Date(dto.timeIn);

    const record = await this.prisma.attendance.create({
      data: {
        employeeId: dto.employeeId,
        date: attendanceDate,
        timeIn,
        status: 'FULL_DAY', // Default, will be recalculated on clock-out
      },
      include: { employee: { select: { id: true, fullName: true, position: true } } },
    });

    // Audit log for clock-in
    await this.auditLogService.log({
      entityType: 'Attendance',
      entityId: record.id,
      action: 'CLOCK_IN',
      oldValue: null,
      newValue: {
        employeeId: dto.employeeId,
        date: dateStr,
        timeIn: dto.timeIn,
      },
      performedBy,
    });

    return record;
  }

  async clockOut(id: string, dto: ClockOutDto, performedBy: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    if (attendance.locked) {
      throw new BadRequestException('This attendance record is locked and cannot be modified');
    }

    if (attendance.timeOut) {
      throw new BadRequestException('Employee already clocked out');
    }

    const timeOut = new Date(dto.timeOut);
    const timeIn = new Date(attendance.timeIn);

    // Calculate total hours
    const diffMs = timeOut.getTime() - timeIn.getTime();
    const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    // Validate max hours
    if (totalHours > MAX_HOURS_PER_DAY) {
      throw new BadRequestException(`Cannot log more than ${MAX_HOURS_PER_DAY} hours per day`);
    }

    if (totalHours < 0) {
      throw new BadRequestException('Clock-out time cannot be before clock-in time');
    }

    // Determine attendance status
    let status: 'FULL_DAY' | 'HALF_DAY' | 'OVERTIME';
    if (totalHours > STANDARD_HOURS_PER_DAY) {
      status = 'OVERTIME';
    } else if (totalHours <= HALF_DAY_HOURS_CAP) {
      status = 'HALF_DAY';
    } else {
      status = 'FULL_DAY';
    }

    const record = await this.prisma.attendance.update({
      where: { id },
      data: {
        timeOut,
        totalHours,
        status,
      },
      include: { employee: { select: { id: true, fullName: true, position: true } } },
    });

    // Audit log for clock-out
    await this.auditLogService.log({
      entityType: 'Attendance',
      entityId: id,
      action: 'CLOCK_OUT',
      oldValue: { timeOut: null, totalHours: null, status: attendance.status },
      newValue: { timeOut: dto.timeOut, totalHours, status },
      performedBy,
    });

    return record;
  }

  async update(id: string, dto: UpdateAttendanceDto, performedBy: string) {
    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attendance record not found');
    if (existing.locked) throw new BadRequestException('This attendance record is locked');

    // Audit log for backdating or modifications
    await this.auditLogService.log({
      entityType: 'Attendance',
      entityId: id,
      action: 'UPDATE',
      oldValue: {
        timeIn: existing.timeIn,
        timeOut: existing.timeOut,
        totalHours: existing.totalHours ? Number(existing.totalHours) : null,
        status: existing.status,
      },
      newValue: dto as any,
      performedBy,
    });

    // Recalculate hours if both timeIn and timeOut are present
    const timeIn = dto.timeIn ? new Date(dto.timeIn) : existing.timeIn;
    const timeOut = dto.timeOut ? new Date(dto.timeOut) : existing.timeOut;

    let totalHours = existing.totalHours ? Number(existing.totalHours) : null;
    let status = existing.status;

    if (timeIn && timeOut) {
      const diffMs = new Date(timeOut).getTime() - new Date(timeIn).getTime();
      totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

      if (totalHours > MAX_HOURS_PER_DAY) {
        throw new BadRequestException(`Cannot log more than ${MAX_HOURS_PER_DAY} hours per day`);
      }

      if (totalHours > STANDARD_HOURS_PER_DAY) {
        status = 'OVERTIME';
      } else if (totalHours <= HALF_DAY_HOURS_CAP) {
        status = 'HALF_DAY';
      } else {
        status = 'FULL_DAY';
      }
    }

    return this.prisma.attendance.update({
      where: { id },
      data: {
        timeIn: dto.timeIn ? new Date(dto.timeIn) : undefined,
        timeOut: dto.timeOut ? new Date(dto.timeOut) : undefined,
        totalHours,
        status: dto.status || status,
      },
      include: { employee: { select: { id: true, fullName: true, position: true } } },
    });
  }

  async delete(id: string, performedBy: string) {
    const existing = await this.prisma.attendance.findUnique({
      where: { id },
      include: { employee: { select: { id: true, fullName: true } } },
    });
    if (!existing) throw new NotFoundException('Attendance record not found');
    if (existing.locked) throw new BadRequestException('This attendance record is locked and cannot be deleted');

    // Audit log before deletion
    await this.auditLogService.log({
      entityType: 'Attendance',
      entityId: id,
      action: 'DELETE',
      oldValue: {
        employeeId: existing.employeeId,
        employeeName: existing.employee?.fullName,
        date: existing.date,
        timeIn: existing.timeIn,
        timeOut: existing.timeOut,
        totalHours: existing.totalHours ? Number(existing.totalHours) : null,
        status: existing.status,
      },
      newValue: null,
      performedBy,
    });

    await this.prisma.attendance.delete({ where: { id } });
    return { success: true, message: 'Attendance record deleted' };
  }

  async getTodayStats() {
    const [today, tomorrow] = this.getPHTTodayRange();

    const [presentToday, overtimeToday] = await Promise.all([
      this.prisma.attendance.count({
        where: { date: { gte: today, lt: tomorrow } },
      }),
      this.prisma.attendance.count({
        where: { date: { gte: today, lt: tomorrow }, status: 'OVERTIME' },
      }),
    ]);

    return { presentToday, overtimeToday };
  }

  async lockByPeriod(periodStart: Date, periodEnd: Date) {
    return this.prisma.attendance.updateMany({
      where: {
        date: { gte: periodStart, lte: periodEnd },
        locked: false,
      },
      data: { locked: true },
    });
  }
}
