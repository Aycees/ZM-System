import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { SettingsService } from '../settings/settings.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { STANDARD_HOURS_PER_DAY, SETTINGS_KEYS, FREQUENCY_DAYS } from '@zm/shared';
import { GeneratePayrollDto, AddDeductionDto, UpdateDeductionDto, AddIncentiveDto, UpdateIncentiveDto } from './dto';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
    private settingsService: SettingsService,
    private auditLogService: AuditLogService,
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
          incentiveItems: true,
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
        incentiveItems: true,
      },
    });
    if (!record) throw new NotFoundException('Payroll record not found');
    return record;
  }

  async generate(dto: GeneratePayrollDto, performedBy: string) {
    const periodStart = new Date(dto.periodStart + 'T00:00:00.000Z');

    // Auto-calculate periodEnd from frequency
    let periodEnd: Date;
    if (dto.periodEnd) {
      periodEnd = new Date(dto.periodEnd + 'T00:00:00.000Z');
    } else {
      const days = FREQUENCY_DAYS[dto.frequency] || 7;
      periodEnd = new Date(periodStart);
      periodEnd.setUTCDate(periodEnd.getUTCDate() + days - 1);
    }

    if (periodEnd <= periodStart) {
      throw new BadRequestException('Period end must be after period start');
    }

    // Get overtime rate from settings
    const overtimeRateSetting = await this.settingsService.getValue(
      SETTINGS_KEYS.OVERTIME_RATE_PER_HOUR,
    );
    const overtimeRate = parseFloat(overtimeRateSetting || '100');

    // Get employees: either selected or all active
    let employees;
    if (dto.employeeIds && dto.employeeIds.length > 0) {
      employees = await this.prisma.employee.findMany({
        where: { id: { in: dto.employeeIds }, status: 'ACTIVE' },
      });
    } else {
      employees = await this.prisma.employee.findMany({
        where: { status: 'ACTIVE' },
      });
    }

    if (employees.length === 0) {
      throw new BadRequestException('No active employees found for payroll generation');
    }

    // Use transaction to prevent race conditions
    const results = await this.prisma.$transaction(async (tx) => {
      const created = [];

      for (const employee of employees) {
        // Check for overlapping payroll periods
        const overlapping = await tx.salaryRecord.findFirst({
          where: {
            employeeId: employee.id,
            OR: [
              { periodStart: { lte: periodEnd }, periodEnd: { gte: periodStart } },
            ],
          },
        });

        if (overlapping) continue; // Skip if overlapping period exists

        // Get attendance records for the period
        const attendanceRecords = await tx.attendance.findMany({
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

        // Calculate regular hours, regular days, and overtime hours
        let regularHours = 0;
        let regularDays = 0;
        let overtimeHours = 0;

        for (const record of attendanceRecords) {
          const hours = record.totalHours ? Number(record.totalHours) : 0;

          if (hours >= STANDARD_HOURS_PER_DAY) {
            regularHours += STANDARD_HOURS_PER_DAY;
            regularDays += 1; // Full day
            overtimeHours += hours - STANDARD_HOURS_PER_DAY;
          } else if (hours > 0) {
            regularHours += hours;
            regularDays += hours / STANDARD_HOURS_PER_DAY;
          }
        }

        // Updated formula: totalRegularHours × (dailyRate / 8) + overtimeHours × OTRate
        const dailyRate = Number(employee.dailyRate);
        const hourlyRate = dailyRate / STANDARD_HOURS_PER_DAY;
        const regularPay = regularHours * hourlyRate;
        const overtimePay = overtimeHours * overtimeRate;
        const grossPay = regularPay + overtimePay;

        const salaryRecord = await tx.salaryRecord.create({
          data: {
            employeeId: employee.id,
            periodStart,
            periodEnd,
            frequency: dto.frequency,
            regularDays,
            regularHours,
            overtimeHours,
            dailyRate,
            overtimeRate,
            grossPay,
            incentives: 0,
            deductions: 0,
            netPay: grossPay,
            status: 'DRAFT',
          },
          include: {
            employee: { select: { id: true, fullName: true, position: true } },
          },
        });

        created.push(salaryRecord);
      }

      return created;
    });

    // Audit log
    if (results.length > 0) {
      await this.auditLogService.log({
        entityType: 'Payroll',
        entityId: 'batch',
        action: 'CREATE',
        oldValue: null,
        newValue: {
          periodStart: dto.periodStart,
          periodEnd: periodEnd.toISOString().split('T')[0],
          frequency: dto.frequency,
          employeeCount: results.length,
          employeeIds: results.map((r) => r.employeeId),
        },
        performedBy,
      });
    }

    return results;
  }

  async addDeduction(payrollId: string, dto: AddDeductionDto, performedBy: string) {
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
    await this.recalculateTotals(payrollId);

    // Audit log
    await this.auditLogService.log({
      entityType: 'Deduction',
      entityId: deduction.id,
      action: 'CREATE',
      oldValue: null,
      newValue: { payrollId, type: dto.type, description: dto.description, amount: dto.amount },
      performedBy,
    });

    return deduction;
  }

  async updateDeduction(payrollId: string, deductionId: string, dto: UpdateDeductionDto, performedBy: string) {
    const payroll = await this.findOne(payrollId);
    if (payroll.status === 'FINALIZED') {
      throw new BadRequestException('Cannot modify deductions on a finalized payroll');
    }

    const existing = await this.prisma.deduction.findUnique({ where: { id: deductionId } });
    if (!existing || existing.salaryRecordId !== payrollId) {
      throw new NotFoundException('Deduction not found');
    }

    const updated = await this.prisma.deduction.update({
      where: { id: deductionId },
      data: {
        description: dto.description,
        amount: dto.amount,
      },
    });

    await this.recalculateTotals(payrollId);

    await this.auditLogService.log({
      entityType: 'Deduction',
      entityId: deductionId,
      action: 'UPDATE',
      oldValue: { description: existing.description, amount: Number(existing.amount) },
      newValue: { description: dto.description ?? existing.description, amount: dto.amount ?? Number(existing.amount) },
      performedBy,
    });

    return updated;
  }

  async deleteDeduction(payrollId: string, deductionId: string, performedBy: string) {
    const payroll = await this.findOne(payrollId);
    if (payroll.status === 'FINALIZED') {
      throw new BadRequestException('Cannot delete deductions from a finalized payroll');
    }

    const existing = await this.prisma.deduction.findUnique({ where: { id: deductionId } });
    if (!existing || existing.salaryRecordId !== payrollId) {
      throw new NotFoundException('Deduction not found');
    }

    // If it was a cash advance deduction, restore the balance
    if (existing.cashAdvanceId) {
      const cashAdvance = await this.prisma.cashAdvance.findUnique({ where: { id: existing.cashAdvanceId } });
      if (cashAdvance) {
        const restoredBalance = Number(cashAdvance.remainingBalance) + Number(existing.amount);
        await this.prisma.cashAdvance.update({
          where: { id: existing.cashAdvanceId },
          data: {
            remainingBalance: restoredBalance,
            status: restoredBalance > 0 ? 'ACTIVE' : 'FULLY_DEDUCTED',
          },
        });
      }
    }

    await this.prisma.deduction.delete({ where: { id: deductionId } });
    await this.recalculateTotals(payrollId);

    await this.auditLogService.log({
      entityType: 'Deduction',
      entityId: deductionId,
      action: 'DELETE',
      oldValue: { type: existing.type, description: existing.description, amount: Number(existing.amount) },
      newValue: null,
      performedBy,
    });

    return { success: true, message: 'Deduction deleted' };
  }

  async addIncentive(payrollId: string, dto: AddIncentiveDto, performedBy: string) {
    const payroll = await this.findOne(payrollId);
    if (payroll.status === 'FINALIZED') {
      throw new BadRequestException('Cannot add incentives to a finalized payroll');
    }

    const incentive = await this.prisma.incentive.create({
      data: {
        salaryRecordId: payrollId,
        type: dto.type,
        description: dto.description,
        amount: dto.amount,
      },
    });

    await this.recalculateTotals(payrollId);

    await this.auditLogService.log({
      entityType: 'Incentive',
      entityId: incentive.id,
      action: 'CREATE',
      oldValue: null,
      newValue: { payrollId, type: dto.type, description: dto.description, amount: dto.amount },
      performedBy,
    });

    return incentive;
  }

  async updateIncentive(payrollId: string, incentiveId: string, dto: UpdateIncentiveDto, performedBy: string) {
    const payroll = await this.findOne(payrollId);
    if (payroll.status === 'FINALIZED') {
      throw new BadRequestException('Cannot modify incentives on a finalized payroll');
    }

    const existing = await this.prisma.incentive.findUnique({ where: { id: incentiveId } });
    if (!existing || existing.salaryRecordId !== payrollId) {
      throw new NotFoundException('Incentive not found');
    }

    const updated = await this.prisma.incentive.update({
      where: { id: incentiveId },
      data: {
        description: dto.description,
        amount: dto.amount,
      },
    });

    await this.recalculateTotals(payrollId);

    await this.auditLogService.log({
      entityType: 'Incentive',
      entityId: incentiveId,
      action: 'UPDATE',
      oldValue: { description: existing.description, amount: Number(existing.amount) },
      newValue: { description: dto.description ?? existing.description, amount: dto.amount ?? Number(existing.amount) },
      performedBy,
    });

    return updated;
  }

  async deleteIncentive(payrollId: string, incentiveId: string, performedBy: string) {
    const payroll = await this.findOne(payrollId);
    if (payroll.status === 'FINALIZED') {
      throw new BadRequestException('Cannot delete incentives from a finalized payroll');
    }

    const existing = await this.prisma.incentive.findUnique({ where: { id: incentiveId } });
    if (!existing || existing.salaryRecordId !== payrollId) {
      throw new NotFoundException('Incentive not found');
    }

    await this.prisma.incentive.delete({ where: { id: incentiveId } });
    await this.recalculateTotals(payrollId);

    await this.auditLogService.log({
      entityType: 'Incentive',
      entityId: incentiveId,
      action: 'DELETE',
      oldValue: { type: existing.type, description: existing.description, amount: Number(existing.amount) },
      newValue: null,
      performedBy,
    });

    return { success: true, message: 'Incentive deleted' };
  }

  async deleteRecord(id: string, performedBy: string) {
    const payroll = await this.findOne(id);

    if (payroll.status === 'FINALIZED') {
      throw new BadRequestException('Cannot delete a finalized payroll record');
    }

    // Delete related deductions and incentives first
    await this.prisma.deduction.deleteMany({ where: { salaryRecordId: id } });
    await this.prisma.incentive.deleteMany({ where: { salaryRecordId: id } });
    await this.prisma.salaryRecord.delete({ where: { id } });

    await this.auditLogService.log({
      entityType: 'Payroll',
      entityId: id,
      action: 'DELETE',
      oldValue: {
        employeeId: payroll.employeeId,
        employeeName: payroll.employee?.fullName,
        periodStart: payroll.periodStart,
        periodEnd: payroll.periodEnd,
        grossPay: Number(payroll.grossPay),
        netPay: Number(payroll.netPay),
      },
      newValue: null,
      performedBy,
    });

    return { success: true, message: 'Payroll record deleted' };
  }

  async finalize(id: string, performedBy: string) {
    const payroll = await this.findOne(id);

    if (payroll.status === 'FINALIZED') {
      throw new BadRequestException('Payroll already finalized');
    }

    // Lock attendance records for this period
    await this.attendanceService.lockByPeriod(
      new Date(payroll.periodStart),
      new Date(payroll.periodEnd),
    );

    const result = await this.prisma.salaryRecord.update({
      where: { id },
      data: { status: 'FINALIZED' },
      include: {
        employee: { select: { id: true, fullName: true, position: true } },
        deductionItems: true,
        incentiveItems: true,
      },
    });

    await this.auditLogService.log({
      entityType: 'Payroll',
      entityId: id,
      action: 'FINALIZE',
      oldValue: { status: 'DRAFT' },
      newValue: { status: 'FINALIZED' },
      performedBy,
    });

    return result;
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

  /** Recalculate grossPay, incentives total, deductions total, netPay */
  private async recalculateTotals(payrollId: string) {
    const [deductions, incentives, record] = await Promise.all([
      this.prisma.deduction.aggregate({
        _sum: { amount: true },
        where: { salaryRecordId: payrollId },
      }),
      this.prisma.incentive.aggregate({
        _sum: { amount: true },
        where: { salaryRecordId: payrollId },
      }),
      this.prisma.salaryRecord.findUnique({ where: { id: payrollId } }),
    ]);

    if (!record) return;

    const totalDeductions = Number(deductions._sum.amount || 0);
    const totalIncentives = Number(incentives._sum.amount || 0);

    // Recalculate: grossPay = basePay + incentives (base from regularHours × hourlyRate + OT)
    const hourlyRate = Number(record.dailyRate) / STANDARD_HOURS_PER_DAY;
    const basePay = Number(record.regularHours) * hourlyRate + Number(record.overtimeHours) * Number(record.overtimeRate);
    const grossPay = basePay + totalIncentives;
    const netPay = grossPay - totalDeductions;

    await this.prisma.salaryRecord.update({
      where: { id: payrollId },
      data: {
        incentives: totalIncentives,
        deductions: totalDeductions,
        grossPay,
        netPay,
      },
    });
  }
}
