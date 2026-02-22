import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { SettingsService } from '../settings/settings.service';
import { STANDARD_HOURS_PER_DAY, SETTINGS_KEYS } from '@zm/shared';
import { GeneratePayrollDto, AddDeductionDto } from './dto';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
    private settingsService: SettingsService,
  ) {}

  async findAll(params?: { page?: number; pageSize?: number; status?: string }) {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params?.status) where.status = params.status;

    const [data, total] = await Promise.all([
      this.prisma.salaryRecord.findMany({
        where,
        orderBy: { periodStart: 'desc' },
        skip,
        take: pageSize,
        include: {
          employee: { select: { id: true, fullName: true, position: true } },
          deductionItems: true,
        },
      }),
      this.prisma.salaryRecord.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const record = await this.prisma.salaryRecord.findUnique({
      where: { id },
      include: {
        employee: true,
        deductionItems: { include: { cashAdvance: true } },
      },
    });
    if (!record) throw new NotFoundException('Payroll record not found');
    return record;
  }

  async generate(dto: GeneratePayrollDto) {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    // Get overtime rate from settings
    const overtimeRateSetting = await this.settingsService.getValue(
      SETTINGS_KEYS.OVERTIME_RATE_PER_HOUR,
    );
    const overtimeRate = parseFloat(overtimeRateSetting || '100');

    // Get all active employees
    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
    });

    const results = [];

    for (const employee of employees) {
      // Check if payroll already exists for this employee and period
      const existing = await this.prisma.salaryRecord.findFirst({
        where: {
          employeeId: employee.id,
          periodStart,
          periodEnd,
        },
      });

      if (existing) continue; // Skip if already generated

      // Get attendance records for the period
      const attendanceRecords = await this.prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          date: { gte: periodStart, lte: periodEnd },
        },
      });

      // Check for missing clock-outs
      const pendingRecords = attendanceRecords.filter((a) => !a.timeOut);
      if (pendingRecords.length > 0) {
        continue; // Skip employees with pending attendance
      }

      // Calculate regular days and overtime hours
      let regularDays = 0;
      let overtimeHours = 0;

      for (const record of attendanceRecords) {
        const hours = record.totalHours ? Number(record.totalHours) : 0;

        if (hours >= STANDARD_HOURS_PER_DAY) {
          regularDays += 1; // Full day
          overtimeHours += hours - STANDARD_HOURS_PER_DAY;
        } else if (hours > 0) {
          // Partial day: fraction of a day
          regularDays += hours / STANDARD_HOURS_PER_DAY;
        }
      }

      // Calculate pay
      const dailyRate = Number(employee.dailyRate);
      const grossPay = (regularDays * dailyRate) + (overtimeHours * overtimeRate);

      const salaryRecord = await this.prisma.salaryRecord.create({
        data: {
          employeeId: employee.id,
          periodStart,
          periodEnd,
          regularDays,
          overtimeHours,
          dailyRate,
          overtimeRate,
          grossPay,
          deductions: 0,
          netPay: grossPay, // Will be updated when deductions are added
          status: 'DRAFT',
        },
        include: {
          employee: { select: { id: true, fullName: true, position: true } },
        },
      });

      results.push(salaryRecord);
    }

    return results;
  }

  async addDeduction(payrollId: string, dto: AddDeductionDto) {
    const payroll = await this.findOne(payrollId);

    if (payroll.status === 'FINALIZED') {
      throw new BadRequestException('Cannot add deductions to a finalized payroll');
    }

    // If it's a cash advance deduction, update the cash advance balance
    if (dto.type === 'CASH_ADVANCE' && dto.cashAdvanceId) {
      const cashAdvance = await this.prisma.cashAdvance.findUnique({
        where: { id: dto.cashAdvanceId },
      });

      if (!cashAdvance) throw new NotFoundException('Cash advance not found');
      if (Number(cashAdvance.remainingBalance) < dto.amount) {
        throw new BadRequestException('Deduction amount exceeds cash advance remaining balance');
      }

      const newBalance = Number(cashAdvance.remainingBalance) - dto.amount;
      await this.prisma.cashAdvance.update({
        where: { id: dto.cashAdvanceId },
        data: {
          remainingBalance: newBalance,
          status: newBalance <= 0 ? 'FULLY_DEDUCTED' : 'ACTIVE',
        },
      });
    }

    // Create deduction
    const deduction = await this.prisma.deduction.create({
      data: {
        salaryRecordId: payrollId,
        type: dto.type,
        description: dto.description,
        amount: dto.amount,
        cashAdvanceId: dto.cashAdvanceId,
      },
    });

    // Update totals on salary record
    const totalDeductions = Number(payroll.deductions) + dto.amount;
    const netPay = Number(payroll.grossPay) - totalDeductions;

    await this.prisma.salaryRecord.update({
      where: { id: payrollId },
      data: {
        deductions: totalDeductions,
        netPay,
      },
    });

    return deduction;
  }

  async finalize(id: string) {
    const payroll = await this.findOne(id);

    if (payroll.status === 'FINALIZED') {
      throw new BadRequestException('Payroll already finalized');
    }

    // Lock attendance records for this period
    await this.attendanceService.lockByPeriod(
      new Date(payroll.periodStart),
      new Date(payroll.periodEnd),
    );

    return this.prisma.salaryRecord.update({
      where: { id },
      data: { status: 'FINALIZED' },
      include: {
        employee: { select: { id: true, fullName: true, position: true } },
        deductionItems: true,
      },
    });
  }

  async getCurrentPeriodTotal() {
    const now = new Date();
    const result = await this.prisma.salaryRecord.aggregate({
      _sum: { netPay: true },
      where: {
        periodEnd: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    });
    return Number(result._sum.netPay || 0);
  }
}
