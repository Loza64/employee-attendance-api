import { AppError } from '../../../shared/errors/AppError';
import { AttendanceRepository } from '../domain/attendance.repository';

export class DeleteAttendanceUseCase {
  constructor(private readonly attendanceRepository: AttendanceRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.attendanceRepository.delete(id);
    if (!deleted) {
      throw new AppError('Registro de asistencia no encontrado', 404);
    }
  }
}
