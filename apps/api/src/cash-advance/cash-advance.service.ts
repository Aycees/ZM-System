import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashAdvanceDto } from './dto';

@Injectable()
export class CashAdvanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { employeeId?: string; status?: string }) {
    const where: any = {};
    if (params?.employeeId) where.employeeId = params.employeeId;
    if (params?.status) where.status = params.status;

    return this.prisma.cashAdvance.findMany({
      where,
      orderBy: { dateGiven: 'desc' },
      include: { employee: { select: { id: true, fullName: true } } },
    });
  }

  async findByEmployee(employeeId: string) {
    const advances = await this.prisma.cashAdvance.findMany({
      where: { employeeId },
      orderBy: { dateGiven: 'desc' },
    });

    const totalAdvances = advances.reduce(
      (sum, a) => sum + Number(a.amount),
      0,
    );
    const totalRemaining = advances.reduce(
      (sum, a) => sum + Number(a.remainingBalance),
      0,
    );

    return {
      advances,
      summary: {
        totalAdvances,
        totalRemaining,
        totalDeducted: totalAdvances - totalRemaining,
      },
    };
  }

  async create(dto: CreateCashAdvanceDto) {
    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.cashAdvance.create({
      data: {
        employeeId: dto.employeeId,
        amount: dto.amount,
        description: dto.description,
        dateGiven: new Date(dto.dateGiven),
        remainingBalance: dto.amount, // Initially, remaining = full amount
        status: 'ACTIVE',
      },
      include: { employee: { select: { id: true, fullName: true } } },
    });
  }

  async update(id: string, data: Partial<CreateCashAdvanceDto>) {
    const existing = await this.prisma.cashAdvance.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Cash advance not found');

    return this.prisma.cashAdvance.update({
      where: { id },
      data: {
        ...data,
        dateGiven: data.dateGiven ? new Date(data.dateGiven) : undefined,
      },
    });
  }
}
