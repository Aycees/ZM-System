import { IsString, IsNotEmpty, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateCashAdvanceDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  dateGiven: string;
}
