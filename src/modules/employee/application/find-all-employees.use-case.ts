import { Page } from '../../../shared/pagination/pagination.types';
import { Employee } from '../domain/employee.entity';
import { EmployeeListParams, EmployeeRepository } from '../domain/employee.repository';

export class FindAllEmployeesUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  execute(params: EmployeeListParams): Promise<Page<Employee>> {
    return this.employeeRepository.findAll(params);
  }
}
