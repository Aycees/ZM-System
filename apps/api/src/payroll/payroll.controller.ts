import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { PayrollService } from './payroll.service';
import { GeneratePayrollDto, AddDeductionDto } from './dto';
import { UserRole } from '@prisma/client';

@Controller('payroll')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.payrollService.findAll({
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      status,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.payrollService.findOne(id);
    return { success: true, data };
  }

  @Post('generate')
  async generate(@Body() dto: GeneratePayrollDto) {
    const data = await this.payrollService.generate(dto);
    return { success: true, data, message: `Payroll generated for ${data.length} employees` };
  }

  @Post(':id/deductions')
  async addDeduction(@Param('id') id: string, @Body() dto: AddDeductionDto) {
    const data = await this.payrollService.addDeduction(id, dto);
    return { success: true, data, message: 'Deduction added successfully' };
  }

  @Patch(':id/finalize')
  async finalize(@Param('id') id: string) {
    const data = await this.payrollService.finalize(id);
    return { success: true, data, message: 'Payroll finalized successfully' };
  }
}
