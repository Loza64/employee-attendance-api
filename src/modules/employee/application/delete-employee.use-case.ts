import { AppError } from '../../../shared/errors/AppError';
import { AttendanceRepository } from '../../attendance/domain/attendance.repository';
import { EmployeeRepository } from '../domain/employee.repository';

export class DeleteEmployeeUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly attendanceRepository: AttendanceRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Empleado no encontrado', 404);
    }

    if (await this.attendanceRepository.existsForEmployee(id)) {
      throw new AppError(
        'El empleado tiene registros de asistencia y no puede eliminarse; desactívalo con isActive: false',
        409,
      );
    }

    await this.employeeRepository.delete(id);
  }
}
