import { Page } from '../../../shared/pagination/pagination.types';
import { Attendance } from '../domain/attendance.entity';
import { AttendanceListParams, AttendanceRepository } from '../domain/attendance.repository';
import { assertValidRange } from './date-range';

export class FindAllAttendanceUseCase {
  constructor(private readonly attendanceRepository: AttendanceRepository) {}

  async execute(params: AttendanceListParams): Promise<Page<Attendance>> {
    assertValidRange(params.from, params.to);
    return this.attendanceRepository.findAll(params);
  }
}
