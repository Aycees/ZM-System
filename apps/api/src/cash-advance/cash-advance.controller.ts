import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { CashAdvanceService } from './cash-advance.service';
import { CreateCashAdvanceDto } from './dto';
import { UserRole } from '@zm/db';

@Controller('cash-advances')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class CashAdvanceController {
  constructor(private cashAdvanceService: CashAdvanceService) {}

  @Get()
  async findAll(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.cashAdvanceService.findAll({ employeeId, status });
    return { success: true, data };
  }

  @Get('employee/:id')
  async findByEmployee(@Param('id') id: string) {
    const result = await this.cashAdvanceService.findByEmployee(id);
    return { success: true, ...result };
  }

  @Post()
  async create(@Body() dto: CreateCashAdvanceDto) {
    const data = await this.cashAdvanceService.create(dto);
    return { success: true, data, message: 'Cash advance recorded successfully' };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateCashAdvanceDto>) {
    const data = await this.cashAdvanceService.update(id, dto);
    return { success: true, data, message: 'Cash advance updated successfully' };
  }
}
