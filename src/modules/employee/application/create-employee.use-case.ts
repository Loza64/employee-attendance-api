import { AppError } from '../../../shared/errors/AppError';
import { Employee } from '../domain/employee.entity';
import { EmployeeRepository } from '../domain/employee.repository';
import { CreateEmployeeDto } from './create-employee.dto';

export class CreateEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(input: CreateEmployeeDto): Promise<Employee> {
    if (await this.employeeRepository.findByCode(input.employeeCode)) {
      throw new AppError('El código de empleado ya está en uso', 409);
    }
    if (await this.employeeRepository.findByEmail(input.email)) {
      throw new AppError('El email ya está registrado', 409);
    }

    const employee = new Employee();
    employee.employeeCode = input.employeeCode;
    employee.name = input.name;
    employee.email = input.email;
    employee.department = input.department;
    employee.position = input.position;
    employee.hireDate = input.hireDate;

    return this.employeeRepository.save(employee);
  }
}
