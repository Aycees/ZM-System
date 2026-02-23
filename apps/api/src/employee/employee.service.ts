import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { EmployeeStatus } from '@zm/db';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';

@Injectable()
export class EmployeeService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async findAll(status?: EmployeeStatus) {
    return this.prisma.employee.findMany({
      where: status ? { status } : undefined,
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        attendance: { orderBy: { date: 'desc' }, take: 10 },
        cashAdvances: { where: { status: 'ACTIVE' }, orderBy: { dateGiven: 'desc' } },
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        fullName: dto.fullName,
        address: dto.address,
        contactNumber: dto.contactNumber,
        emergencyContact: dto.emergencyContact,
        position: dto.position,
        dailyRate: dto.dailyRate,
        hireDate: new Date(dto.hireDate),
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto, performedBy: string) {
    const existing = await this.findOne(id);

    // Audit log for daily rate changes
    if (dto.dailyRate !== undefined && Number(existing.dailyRate) !== dto.dailyRate) {
      await this.auditLogService.log({
        entityType: 'Employee',
        entityId: id,
        action: 'UPDATE_DAILY_RATE',
        oldValue: { dailyRate: Number(existing.dailyRate) },
        newValue: { dailyRate: dto.dailyRate },
        performedBy,
      });
    }

    // Audit log for other field changes
    const changedFields: Record<string, unknown> = {};
    const oldFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (key !== 'dailyRate' && value !== undefined) {
        const existingValue = (existing as any)[key];
        if (existingValue !== value) {
          oldFields[key] = existingValue;
          changedFields[key] = value;
        }
      }
    }
    if (Object.keys(changedFields).length > 0) {
      await this.auditLogService.log({
        entityType: 'Employee',
        entityId: id,
        action: 'UPDATE',
        oldValue: oldFields,
        newValue: changedFields,
        performedBy,
      });
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...dto,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
      },
    });
  }

  async archive(id: string, performedBy: string) {
    const existing = await this.findOne(id);

    // Check if employee has any finalized payroll records
    const hasPayroll = await this.prisma.salaryRecord.findFirst({
      where: { employeeId: id },
    });

    if (hasPayroll) {
      // Cannot delete, only archive
      await this.auditLogService.log({
        entityType: 'Employee',
        entityId: id,
        action: 'ARCHIVE',
        oldValue: { status: existing.status },
        newValue: { status: 'ARCHIVED' },
        performedBy,
      });
    }

    return this.prisma.employee.update({
      where: { id },
      data: { status: EmployeeStatus.ARCHIVED },
    });
  }

  async getActiveCount() {
    return this.prisma.employee.count({ where: { status: 'ACTIVE' } });
  }
}
