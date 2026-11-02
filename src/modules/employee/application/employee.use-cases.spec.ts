import { AttendanceRepository } from '../../attendance/domain/attendance.repository';
import { Employee } from '../domain/employee.entity';
import { EmployeeRepository } from '../domain/employee.repository';
import { CreateEmployeeUseCase } from './create-employee.use-case';
import { DeleteEmployeeUseCase } from './delete-employee.use-case';
import { FindEmployeeByIdUseCase } from './find-employee-by-id.use-case';
import { UpdateEmployeeUseCase } from './update-employee.use-case';

const ID = '507f1f77bcf86cd799439011';
const makeEmployee = (overrides: Partial<Employee> = {}) =>
  Object.assign(new Employee(), {
    id: ID,
    employeeCode: 'EMP-001',
    name: 'Ana Lopez',
    email: 'ana@example.com',
    department: 'IT',
    position: 'Developer',
    hireDate: '2026-01-15',
    ...overrides,
  });

describe('employee use cases', () => {
  const employeeRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<EmployeeRepository>;
  const attendanceRepository = { existsForEmployee: jest.fn() } as unknown as jest.Mocked<AttendanceRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    employeeRepository.save.mockImplementation(async (employee) => employee);
  });

  describe('CreateEmployeeUseCase', () => {
    const useCase = new CreateEmployeeUseCase(employeeRepository);
    const input = {
      employeeCode: 'EMP-001',
      name: 'Ana Lopez',
      email: 'ana@example.com',
      department: 'IT',
      position: 'Developer',
      hireDate: '2026-01-15',
    };

    it('409 when the employee code is already used', async () => {
      employeeRepository.findByCode.mockResolvedValue(makeEmployee());

      await expect(useCase.execute(input)).rejects.toMatchObject({ statusCode: 409 });
      expect(employeeRepository.save).not.toHaveBeenCalled();
    });

    it('409 when the email is already registered', async () => {
      employeeRepository.findByCode.mockResolvedValue(null);
      employeeRepository.findByEmail.mockResolvedValue(makeEmployee());

      await expect(useCase.execute(input)).rejects.toMatchObject({ statusCode: 409 });
    });

    it('creates an active employee', async () => {
      employeeRepository.findByCode.mockResolvedValue(null);
      employeeRepository.findByEmail.mockResolvedValue(null);

      const employee = await useCase.execute(input);

      expect(employee).toMatchObject({ employeeCode: 'EMP-001', hireDate: '2026-01-15', isActive: true });
    });
  });

  describe('UpdateEmployeeUseCase', () => {
    const useCase = new UpdateEmployeeUseCase(employeeRepository);

    it('400 when no field is sent', async () => {
      await expect(useCase.execute(ID, {})).rejects.toMatchObject({ statusCode: 400 });
    });

    it('404 when the employee does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(ID, { name: 'Otro' })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('409 when the new email belongs to another employee', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      employeeRepository.findByEmail.mockResolvedValue(makeEmployee({ id: 'other' }));

      await expect(useCase.execute(ID, { email: 'taken@example.com' })).rejects.toMatchObject({ statusCode: 409 });
    });

    it('updates only the sent fields and can deactivate', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());

      const updated = await useCase.execute(ID, { position: 'Lead', isActive: false });

      expect(updated).toMatchObject({ position: 'Lead', isActive: false, name: 'Ana Lopez', email: 'ana@example.com' });
    });
  });

  describe('FindEmployeeByIdUseCase', () => {
    it('404 when it does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(new FindEmployeeByIdUseCase(employeeRepository).execute(ID)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('DeleteEmployeeUseCase', () => {
    const useCase = new DeleteEmployeeUseCase(employeeRepository, attendanceRepository);

    it('404 when it does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(ID)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('409 when the employee has attendance records', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.existsForEmployee.mockResolvedValue(true);

      await expect(useCase.execute(ID)).rejects.toMatchObject({ statusCode: 409 });
      expect(employeeRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes an employee without attendance', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.existsForEmployee.mockResolvedValue(false);

      await expect(useCase.execute(ID)).resolves.toBeUndefined();
      expect(employeeRepository.delete).toHaveBeenCalledWith(ID);
    });
  });
});
