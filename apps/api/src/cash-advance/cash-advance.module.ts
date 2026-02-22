import { Module } from '@nestjs/common';
import { CashAdvanceService } from './cash-advance.service';
import { CashAdvanceController } from './cash-advance.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [CashAdvanceController],
  providers: [CashAdvanceService],
  exports: [CashAdvanceService],
})
export class CashAdvanceModule {}
