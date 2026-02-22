import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { ReportsService } from './reports.service';
import { UserRole } from '@prisma/client';
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
    const buffer = await this.reportsService.generatePayrollReport(periodStart, periodEnd);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=payroll_report_${periodStart}_${periodEnd}.xlsx`);
    res.send(buffer);
  }

  @Get('attendance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async attendanceReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateAttendanceReport(dateFrom, dateTo);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${dateFrom}_${dateTo}.xlsx`);
    res.send(buffer);
  }
}
