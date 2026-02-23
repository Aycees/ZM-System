import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsDateString, IsArray, Min } from 'class-validator';
import { DeductionType, IncentiveType, PayrollFrequency } from '@zm/db';

export class GeneratePayrollDto {
  @IsDateString()
  periodStart: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsEnum(PayrollFrequency)
  frequency: PayrollFrequency;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];
}

export class AddDeductionDto {
  @IsEnum(DeductionType)
  type: DeductionType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  cashAdvanceId?: string;
}

export class UpdateDeductionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}

export class AddIncentiveDto {
  @IsEnum(IncentiveType)
  type: IncentiveType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class UpdateIncentiveDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}
