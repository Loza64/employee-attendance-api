import { ListParams, Page } from '../../../shared/pagination/pagination.types';
import { Employee } from './employee.entity';

export interface EmployeeListParams extends ListParams {
  department?: string;
  isActive?: boolean;
}

export interface EmployeeRepository {
  findAll(params: EmployeeListParams): Promise<Page<Employee>>;
  findById(id: string): Promise<Employee | null>;
  findByCode(employeeCode: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  save(employee: Employee): Promise<Employee>;
  delete(id: string): Promise<boolean>;
}
