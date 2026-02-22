import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { AttendanceModule } from '../attendance/attendance.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [AttendanceModule, AuditLogModule, SettingsModule],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
