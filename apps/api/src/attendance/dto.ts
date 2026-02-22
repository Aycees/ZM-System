import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class LogAttendanceDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsString()
  @IsNotEmpty()
  timeIn: string;
}

export class ClockOutDto {
  @IsString()
  @IsNotEmpty()
  timeOut: string;
}

export class UpdateAttendanceDto {
  @IsOptional()
  @IsString()
  timeIn?: string;

  @IsOptional()
  @IsString()
  timeOut?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}
