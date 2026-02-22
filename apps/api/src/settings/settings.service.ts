import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async findAll() {
    return this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  async getValue(key: string): Promise<string | null> {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async update(key: string, value: string, performedBy: string) {
    const existing = await this.prisma.setting.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException(`Setting "${key}" not found`);

    await this.auditLogService.log({
      entityType: 'Setting',
      entityId: existing.id,
      action: 'UPDATE',
      oldValue: { key, value: existing.value },
      newValue: { key, value },
      performedBy,
    });

    return this.prisma.setting.update({
      where: { key },
      data: { value, updatedBy: performedBy },
    });
  }
}
