import { Employee } from '../../domain/employee.entity';
import type { EmployeeDocument } from './employee.schema';

export type EmployeeSummaryDocument = Pick<
  EmployeeDocument,
  '_id' | 'employeeCode' | 'name' | 'department' | 'position'
>;

export const toEmployeeDomain = (doc: EmployeeSummaryDocument & Partial<EmployeeDocument>): Employee =>
  Object.assign(new Employee(), {
    id: doc._id.toString(),
    employeeCode: doc.employeeCode,
    name: doc.name,
    email: doc.email ?? '',
    department: doc.department,
    position: doc.position,
    hireDate: doc.hireDate ?? '',
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt ?? new Date(0),
    updatedAt: doc.updatedAt ?? new Date(0),
  });
