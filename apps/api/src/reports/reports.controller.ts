import { Controller, Get, Query, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { ReportsService } from './reports.service';
import { UserRole } from '@zm/db';
import { Response } from 'express';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('payroll')
  @Roles(UserRole.ADMIN)
  async payrollReport(
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
    @Res() res: Response,
  ) {
    if (!periodStart || !periodEnd) {
      throw new BadRequestException('periodStart and periodEnd query parameters are required');
    }
    const buffer = await this.reportsService.generatePayrollReport(periodStart, periodEnd);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=payroll_report_${periodStart}_${periodEnd}.xlsx`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Get('attendance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async attendanceReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Res() res: Response,
  ) {
    if (!dateFrom || !dateTo) {
      throw new BadRequestException('dateFrom and dateTo query parameters are required');
    }
    const buffer = await this.reportsService.generateAttendanceReport(dateFrom, dateTo);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${dateFrom}_${dateTo}.xlsx`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }
}
