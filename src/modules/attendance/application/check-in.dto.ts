import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckInDto {
  @IsMongoId()
  employeeId!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  notes?: string;
}
