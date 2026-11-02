import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsOffsetDateTime } from '../../../shared/validators/offset-date-time.validator';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsOffsetDateTime()
  checkIn?: string;

  @IsOptional()
  @IsOffsetDateTime()
  checkOut?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
