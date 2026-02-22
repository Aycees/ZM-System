import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';
import { UserRole, EmployeeStatus } from '@prisma/client';

@Controller('employees')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll(@Query('status') status?: EmployeeStatus) {
    const employees = await this.employeeService.findAll(status);
    return { success: true, data: employees };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findOne(@Param('id') id: string) {
    const employee = await this.employeeService.findOne(id);
    return { success: true, data: employee };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateEmployeeDto) {
    const employee = await this.employeeService.create(dto);
    return { success: true, data: employee, message: 'Employee created successfully' };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @Request() req: any,
  ) {
    const employee = await this.employeeService.update(id, dto, req.user.id);
    return { success: true, data: employee, message: 'Employee updated successfully' };
  }

  @Patch(':id/archive')
  @Roles(UserRole.ADMIN)
  async archive(@Param('id') id: string, @Request() req: any) {
    const employee = await this.employeeService.archive(id, req.user.id);
    return { success: true, data: employee, message: 'Employee archived successfully' };
  }
}
