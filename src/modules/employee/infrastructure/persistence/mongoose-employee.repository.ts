import { AppError } from '../../../../shared/errors/AppError';
import { duplicateKeyFields, isDuplicateKeyError } from '../../../../shared/database/mongo';
import { Page } from '../../../../shared/pagination/pagination.types';
import { containsRegex, escapeRegex } from '../../../../shared/pagination/regex-search.util';
import { Employee } from '../../domain/employee.entity';
import { EmployeeListParams, EmployeeRepository } from '../../domain/employee.repository';
import { toEmployeeDomain } from './employee.mapper';
import { EmployeeModel } from './employee.schema';

const toConflict = (err: unknown): AppError =>
  duplicateKeyFields(err).includes('employeeCode')
    ? new AppError('El código de empleado ya está en uso', 409)
    : new AppError('El email ya está registrado', 409);

export class MongooseEmployeeRepository implements EmployeeRepository {
  async findAll({ page, pageSize, search, department, isActive }: EmployeeListParams): Promise<Page<Employee>> {
    const filter: Record<string, unknown> = {};
    if (department) filter.department = new RegExp(`^${escapeRegex(department)}$`, 'i');
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
      const pattern = containsRegex(search);
      filter.$or = [{ name: pattern }, { employeeCode: pattern }, { email: pattern }];
    }

    const result = await EmployeeModel.paginate(filter, {
      page,
      limit: pageSize,
      sort: { createdAt: -1, _id: -1 },
      lean: true,
    });

    return {
      items: result.docs.map(toEmployeeDomain),
      meta: {
        page: result.page ?? page,
        pageSize: result.limit,
        pageCount: result.totalPages,
        total: result.totalDocs,
      },
    };
  }

  async findById(id: string): Promise<Employee | null> {
    const doc = await EmployeeModel.findById(id).lean();
    return doc ? toEmployeeDomain(doc) : null;
  }

  async findByCode(employeeCode: string): Promise<Employee | null> {
    const doc = await EmployeeModel.findOne({ employeeCode }).lean();
    return doc ? toEmployeeDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    const doc = await EmployeeModel.findOne({ email }).lean();
    return doc ? toEmployeeDomain(doc) : null;
  }

  async save(employee: Employee): Promise<Employee> {
    const fields = {
      name: employee.name,
      email: employee.email,
      department: employee.department,
      position: employee.position,
      hireDate: employee.hireDate,
      isActive: employee.isActive,
    };

    try {
      if (!employee.id) {
        const created = await EmployeeModel.create({ ...fields, employeeCode: employee.employeeCode });
        return toEmployeeDomain(created.toObject());
      }

      const updated = await EmployeeModel.findByIdAndUpdate(
        employee.id,
        { $set: fields },
        { new: true, runValidators: true },
      ).lean();

      if (!updated) {
        throw new AppError('Empleado no encontrado', 404);
      }
      return toEmployeeDomain(updated);
    } catch (err) {
      if (isDuplicateKeyError(err)) throw toConflict(err);
      throw err;
    }
  }

  async delete(id: string): Promise<boolean> {
    const { deletedCount } = await EmployeeModel.deleteOne({ _id: id });
    return deletedCount === 1;
  }
}
