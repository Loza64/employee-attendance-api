import { AppError } from '../../../shared/errors/AppError';
import { EmployeeRepository } from '../../employee/domain/employee.repository';
import { Attendance } from '../domain/attendance.entity';
import { AttendanceRepository } from '../domain/attendance.repository';
import { Clock } from '../domain/clock';
import { CheckOutDto } from './check-out.dto';

export class CheckOutUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CheckOutDto): Promise<Attendance> {
    const employee = await this.employeeRepository.findById(input.employeeId);
    if (!employee) {
      throw new AppError('Empleado no encontrado', 404);
    }

    const attendance = await this.attendanceRepository.findOpenByEmployee(employee.id);
    if (!attendance) {
      throw new AppError('El empleado no tiene una entrada abierta para registrar la salida', 409);
    }

    attendance.close(this.clock.now());

    const closed = await this.attendanceRepository.closeIfOpen(attendance);
    if (!closed) {
      throw new AppError('La salida de este registro ya fue registrada', 409);
    }

    return closed;
  }
}
