import { AppError } from '../../../shared/errors/AppError';
import { Page } from '../../../shared/pagination/pagination.types';
import { EmployeeRepository } from '../../employee/domain/employee.repository';
import { Attendance } from '../domain/attendance.entity';
import { AttendanceRepository, AttendanceStatus, AttendanceSummary } from '../domain/attendance.repository';
import { assertValidRange } from './date-range';

export interface EmployeeHistoryParams {
  employeeId: string;
  from?: string;
  to?: string;
  status?: AttendanceStatus;
  page: number;
  pageSize: number;
}

export interface EmployeeHistory {
  records: Page<Attendance>;
  summary: AttendanceSummary;
}

export class GetEmployeeHistoryUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute(params: EmployeeHistoryParams): Promise<EmployeeHistory> {
    assertValidRange(params.from, params.to);

    const employee = await this.employeeRepository.findById(params.employeeId);
    if (!employee) {
      throw new AppError('Empleado no encontrado', 404);
    }

    const { page, pageSize, ...filter } = params;
    const [records, summary] = await Promise.all([
      this.attendanceRepository.findAll(params),
      this.attendanceRepository.summarize(filter),
    ]);

    return { records, summary };
  }
}
