import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { PayrollService } from './payroll.service';
import { GeneratePayrollDto, AddDeductionDto, UpdateDeductionDto, AddIncentiveDto, UpdateIncentiveDto } from './dto';
import { UserRole } from '@zm/db';

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
  async generate(@Body() dto: GeneratePayrollDto, @Request() req: any) {
    const data = await this.payrollService.generate(dto, req.user.id);
    return { success: true, data, message: `Payroll generated for ${data.length} employees` };
  }

  @Delete(':id')
  async deleteRecord(@Param('id') id: string, @Request() req: any) {
    await this.payrollService.deleteRecord(id, req.user.id);
    return { success: true, message: 'Payroll record deleted' };
  }

  @Patch(':id/finalize')
  async finalize(@Param('id') id: string, @Request() req: any) {
    const data = await this.payrollService.finalize(id, req.user.id);
    return { success: true, data, message: 'Payroll finalized successfully' };
  }

  // --- Deductions ---
  @Post(':id/deductions')
  async addDeduction(@Param('id') id: string, @Body() dto: AddDeductionDto, @Request() req: any) {
    const data = await this.payrollService.addDeduction(id, dto, req.user.id);
    return { success: true, data, message: 'Deduction added successfully' };
  }

  @Patch(':id/deductions/:deductionId')
  async updateDeduction(
    @Param('id') id: string,
    @Param('deductionId') deductionId: string,
    @Body() dto: UpdateDeductionDto,
    @Request() req: any,
  ) {
    const data = await this.payrollService.updateDeduction(id, deductionId, dto, req.user.id);
    return { success: true, data, message: 'Deduction updated' };
  }

  @Delete(':id/deductions/:deductionId')
  async deleteDeduction(
    @Param('id') id: string,
    @Param('deductionId') deductionId: string,
    @Request() req: any,
  ) {
    await this.payrollService.deleteDeduction(id, deductionId, req.user.id);
    return { success: true, message: 'Deduction deleted' };
  }

  // --- Incentives ---
  @Post(':id/incentives')
  async addIncentive(@Param('id') id: string, @Body() dto: AddIncentiveDto, @Request() req: any) {
    const data = await this.payrollService.addIncentive(id, dto, req.user.id);
    return { success: true, data, message: 'Incentive added successfully' };
  }

  @Patch(':id/incentives/:incentiveId')
  async updateIncentive(
    @Param('id') id: string,
    @Param('incentiveId') incentiveId: string,
    @Body() dto: UpdateIncentiveDto,
    @Request() req: any,
  ) {
    const data = await this.payrollService.updateIncentive(id, incentiveId, dto, req.user.id);
    return { success: true, data, message: 'Incentive updated' };
  }

  @Delete(':id/incentives/:incentiveId')
  async deleteIncentive(
    @Param('id') id: string,
    @Param('incentiveId') incentiveId: string,
    @Request() req: any,
  ) {
    await this.payrollService.deleteIncentive(id, incentiveId, req.user.id);
    return { success: true, message: 'Incentive deleted' };
  }
}
