import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../shared/pagination/pagination-query.dto';
import { IsCalendarDate } from '../../../shared/validators/calendar-date.validator';

export enum AttendanceStatusFilter {
  OPEN = 'open',
  CLOSED = 'closed',
}

export class AttendanceHistoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsCalendarDate()
  from?: string;

  @IsOptional()
  @IsCalendarDate()
  to?: string;

  @IsOptional()
  @IsEnum(AttendanceStatusFilter)
  status?: AttendanceStatusFilter;
}

export class AttendanceQueryDto extends AttendanceHistoryQueryDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: string;
}
