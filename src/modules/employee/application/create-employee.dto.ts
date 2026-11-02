import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsCalendarDate } from '../../../shared/validators/calendar-date.validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);
const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

export class CreateEmployeeDto {
  @Transform(upper)
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[A-Z0-9-]+$/, { message: 'employeeCode solo puede contener letras, números y guiones' })
  employeeCode!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @Transform(lower)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  department!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  position!: string;

  @IsCalendarDate()
  hireDate!: string;
}
