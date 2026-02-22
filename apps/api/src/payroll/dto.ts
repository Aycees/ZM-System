import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { DeductionType } from '@prisma/client';

export class GeneratePayrollDto {
  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
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
