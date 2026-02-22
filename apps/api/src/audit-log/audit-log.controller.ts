import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { AuditLogService } from './audit-log.service';
import { UserRole } from '@prisma/client';

@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.auditLogService.findAll({
      entityType,
      entityId,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
    return { success: true, ...result };
  }
}
