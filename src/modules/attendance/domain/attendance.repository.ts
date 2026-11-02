import { Page } from '../../../shared/pagination/pagination.types';
import { Attendance } from './attendance.entity';

export type AttendanceStatus = 'open' | 'closed';

export interface AttendanceFilter {
  employeeId?: string;
  from?: string;
  to?: string;
  status?: AttendanceStatus;
}

export interface AttendanceListParams extends AttendanceFilter {
  page: number;
  pageSize: number;
}

export interface AttendanceSummary {
  totalRecords: number;
  totalWorkedMinutes: number;
  openRecords: number;
}

export interface AttendanceRepository {
  findAll(params: AttendanceListParams): Promise<Page<Attendance>>;
  summarize(filter: AttendanceFilter): Promise<AttendanceSummary>;
  findById(id: string): Promise<Attendance | null>;
  findOpenByEmployee(employeeId: string): Promise<Attendance | null>;
  findByEmployeeAndDate(employeeId: string, date: string): Promise<Attendance | null>;
  existsForEmployee(employeeId: string): Promise<boolean>;
  save(attendance: Attendance): Promise<Attendance>;
  closeIfOpen(attendance: Attendance): Promise<Attendance | null>;
  delete(id: string): Promise<boolean>;
}
