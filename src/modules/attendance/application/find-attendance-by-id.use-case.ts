import { AppError } from '../../../shared/errors/AppError';
import { Attendance } from '../domain/attendance.entity';
import { AttendanceRepository } from '../domain/attendance.repository';

export class FindAttendanceByIdUseCase {
  constructor(private readonly attendanceRepository: AttendanceRepository) {}

  async execute(id: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findById(id);
    if (!attendance) {
      throw new AppError('Registro de asistencia no encontrado', 404);
    }
    return attendance;
  }
}
