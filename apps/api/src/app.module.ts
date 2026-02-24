import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PayrollModule } from './payroll/payroll.module';
import { SettingsModule } from './settings/settings.module';
import { CashAdvanceModule } from './cash-advance/cash-advance.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  controllers: [HealthController],
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    EmployeeModule,
    AttendanceModule,
    PayrollModule,
    SettingsModule,
    CashAdvanceModule,
    AuditLogModule,
    ReportsModule,
    DashboardModule,
  ],
})
export class AppModule {}
