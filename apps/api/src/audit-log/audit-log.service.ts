import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateAuditLogDto {
  entityType: string;
  entityId: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  performedBy: string;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        action: dto.action,
        oldValue: dto.oldValue as any,
        newValue: dto.newValue as any,
        performedBy: dto.performedBy,
      },
    });
  }

  async findAll(params?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    performedBy?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params?.entityType) where.entityType = params.entityType;
    if (params?.entityId) where.entityId = params.entityId;
    if (params?.action) where.action = params.action;
    if (params?.performedBy) where.performedBy = params.performedBy;
    if (params?.dateFrom || params?.dateTo) {
      where.timestamp = {};
      if (params?.dateFrom) where.timestamp.gte = new Date(params.dateFrom + 'T00:00:00.000Z');
      if (params?.dateTo) where.timestamp.lte = new Date(params.dateTo + 'T23:59:59.999Z');
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: pageSize,
        include: { user: { select: { username: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }
}
