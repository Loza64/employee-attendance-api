import { AppError } from '../../../shared/errors/AppError';
import { Employee } from '../domain/employee.entity';
import { EmployeeRepository } from '../domain/employee.repository';

export class FindEmployeeByIdUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Empleado no encontrado', 404);
    }
    return employee;
  }
}
