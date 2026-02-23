import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { AttendanceService } from './attendance.service';
import { LogAttendanceDto, ClockOutDto, UpdateAttendanceDto } from './dto';
import { UserRole } from '@zm/db';

@Controller('attendance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll(
    @Query('employeeId') employeeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.attendanceService.findAll({
      employeeId,
      dateFrom,
      dateTo,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
    return { success: true, ...result };
  }

  @Get('today')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getToday() {
    const data = await this.attendanceService.getToday();
    return { success: true, data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async logClockIn(@Body() dto: LogAttendanceDto) {
    const data = await this.attendanceService.logClockIn(dto);
    return { success: true, data, message: 'Clock-in logged successfully' };
  }

  @Patch(':id/clock-out')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async clockOut(@Param('id') id: string, @Body() dto: ClockOutDto) {
    const data = await this.attendanceService.clockOut(id, dto);
    return { success: true, data, message: 'Clock-out logged successfully' };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
    @Request() req: any,
  ) {
    const data = await this.attendanceService.update(id, dto, req.user.id);
    return { success: true, data, message: 'Attendance updated successfully' };
  }
}
