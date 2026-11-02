import { AppError } from '../../../shared/errors/AppError';
import { EmployeeRepository } from '../../employee/domain/employee.repository';
import { Attendance } from '../domain/attendance.entity';
import { AttendanceRepository } from '../domain/attendance.repository';
import { Clock } from '../domain/clock';
import { CheckInDto } from './check-in.dto';

export class CheckInUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CheckInDto): Promise<Attendance> {
    const employee = await this.employeeRepository.findById(input.employeeId);
    if (!employee) {
      throw new AppError('Empleado no encontrado', 404);
    }
    if (!employee.isActive) {
      throw new AppError('El empleado está inactivo y no puede registrar asistencia', 409);
    }

    if (await this.attendanceRepository.findOpenByEmployee(employee.id)) {
      throw new AppError('El empleado ya tiene una entrada abierta; falta registrar la salida', 409);
    }

    const now = this.clock.now();
    const date = this.clock.businessDate(now);

    if (await this.attendanceRepository.findByEmployeeAndDate(employee.id, date)) {
      throw new AppError('El empleado ya registró asistencia en esta fecha', 409);
    }

    const attendance = new Attendance();
    attendance.employeeId = employee.id;
    attendance.date = date;
    attendance.checkIn = now;
    attendance.notes = input.notes || null;

    return this.attendanceRepository.save(attendance);
  }
}
