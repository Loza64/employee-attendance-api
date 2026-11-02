import { AppError } from '../../../shared/errors/AppError';
import { Employee } from '../domain/employee.entity';
import { EmployeeRepository } from '../domain/employee.repository';
import { UpdateEmployeeDto } from './update-employee.dto';

export class UpdateEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(id: string, input: UpdateEmployeeDto): Promise<Employee> {
    const fields = Object.values(input).filter((value) => value !== undefined);
    if (fields.length === 0) {
      throw new AppError('Debes enviar al menos un campo para actualizar', 400);
    }

    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Empleado no encontrado', 404);
    }

    if (input.email !== undefined && input.email !== employee.email) {
      const owner = await this.employeeRepository.findByEmail(input.email);
      if (owner && owner.id !== employee.id) {
        throw new AppError('El email ya está registrado', 409);
      }
    }

    if (input.name !== undefined) employee.name = input.name;
    if (input.email !== undefined) employee.email = input.email;
    if (input.department !== undefined) employee.department = input.department;
    if (input.position !== undefined) employee.position = input.position;
    if (input.hireDate !== undefined) employee.hireDate = input.hireDate;
    if (input.isActive !== undefined) employee.isActive = input.isActive;

    return this.employeeRepository.save(employee);
  }
}
