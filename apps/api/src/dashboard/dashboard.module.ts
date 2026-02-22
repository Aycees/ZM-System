import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { EmployeeModule } from '../employee/employee.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { PayrollModule } from '../payroll/payroll.module';

@Module({
  imports: [EmployeeModule, AttendanceModule, PayrollModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
