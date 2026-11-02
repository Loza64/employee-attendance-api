import { AppError } from '../../../shared/errors/AppError';
import { Attendance } from '../domain/attendance.entity';
import { AttendanceRepository } from '../domain/attendance.repository';
import { Clock } from '../domain/clock';
import { UpdateAttendanceDto } from './update-attendance.dto';

export class UpdateAttendanceUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly clock: Clock,
  ) {}

  async execute(id: string, input: UpdateAttendanceDto): Promise<Attendance> {
    if (input.checkIn === undefined && input.checkOut === undefined && input.notes === undefined) {
      throw new AppError('Debes enviar al menos un campo para actualizar (checkIn, checkOut o notes)', 400);
    }
    if (input.checkIn === null) {
      throw new AppError('checkIn no puede ser nulo', 400);
    }

    const attendance = await this.attendanceRepository.findById(id);
    if (!attendance) {
      throw new AppError('Registro de asistencia no encontrado', 404);
    }

    const now = this.clock.now();
    const checkIn = input.checkIn !== undefined ? new Date(input.checkIn) : attendance.checkIn;
    const checkOut =
      input.checkOut === undefined ? attendance.checkOut : input.checkOut === null ? null : new Date(input.checkOut);

    if (checkIn.getTime() > now.getTime() || (checkOut && checkOut.getTime() > now.getTime())) {
      throw new AppError('Las horas registradas no pueden estar en el futuro', 400);
    }

    attendance.correct(checkIn, checkOut);

    if (input.checkIn !== undefined) {
      attendance.date = this.clock.businessDate(checkIn);
    }
    if (input.notes !== undefined) {
      attendance.notes = input.notes || null;
    }

    if (attendance.isOpen) {
      const open = await this.attendanceRepository.findOpenByEmployee(attendance.employeeId);
      if (open && open.id !== attendance.id) {
        throw new AppError('El empleado ya tiene otra entrada abierta', 409);
      }
    }

    return this.attendanceRepository.save(attendance);
  }
}
