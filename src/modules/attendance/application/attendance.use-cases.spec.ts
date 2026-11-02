import { Employee } from '../../employee/domain/employee.entity';
import { EmployeeRepository } from '../../employee/domain/employee.repository';
import { Attendance } from '../domain/attendance.entity';
import { AttendanceRepository } from '../domain/attendance.repository';
import { Clock } from '../domain/clock';
import { CheckInUseCase } from './check-in.use-case';
import { CheckOutUseCase } from './check-out.use-case';
import { DeleteAttendanceUseCase } from './delete-attendance.use-case';
import { FindAllAttendanceUseCase } from './find-all-attendance.use-case';
import { GetEmployeeHistoryUseCase } from './get-employee-history.use-case';
import { UpdateAttendanceUseCase } from './update-attendance.use-case';

const EMPLOYEE_ID = '507f1f77bcf86cd799439011';
const RECORD_ID = '507f1f77bcf86cd799439022';
const NOW = new Date('2026-10-26T20:00:00Z');

const makeEmployee = (isActive = true) =>
  Object.assign(new Employee(), { id: EMPLOYEE_ID, employeeCode: 'EMP-001', name: 'Ana', isActive });
const makeRecord = (overrides: Partial<Attendance> = {}) =>
  Object.assign(new Attendance(), {
    id: RECORD_ID,
    employeeId: EMPLOYEE_ID,
    date: '2026-10-26',
    checkIn: new Date('2026-10-26T14:00:00Z'),
    ...overrides,
  });

describe('attendance use cases', () => {
  const clock: Clock = { now: () => NOW, businessDate: (at) => at.toISOString().slice(0, 10) };
  const employeeRepository = { findById: jest.fn() } as unknown as jest.Mocked<EmployeeRepository>;
  const attendanceRepository = {
    findAll: jest.fn(),
    summarize: jest.fn(),
    findById: jest.fn(),
    findOpenByEmployee: jest.fn(),
    findByEmployeeAndDate: jest.fn(),
    existsForEmployee: jest.fn(),
    save: jest.fn(),
    closeIfOpen: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<AttendanceRepository>;

  beforeEach(() => {
    jest.resetAllMocks();
    attendanceRepository.save.mockImplementation(async (attendance) => attendance);
    attendanceRepository.closeIfOpen.mockImplementation(async (attendance) => attendance);
  });

  describe('CheckInUseCase', () => {
    const useCase = new CheckInUseCase(attendanceRepository, employeeRepository, clock);

    it('404 when the employee does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute({ employeeId: EMPLOYEE_ID })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('409 when the employee is inactive', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee(false));

      await expect(useCase.execute({ employeeId: EMPLOYEE_ID })).rejects.toMatchObject({ statusCode: 409 });
      expect(attendanceRepository.save).not.toHaveBeenCalled();
    });

    it('409 when there is an open entry', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.findOpenByEmployee.mockResolvedValue(makeRecord());

      await expect(useCase.execute({ employeeId: EMPLOYEE_ID })).rejects.toMatchObject({ statusCode: 409 });
    });

    it('409 when the employee already has a record for the day', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.findOpenByEmployee.mockResolvedValue(null);
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(makeRecord());

      await expect(useCase.execute({ employeeId: EMPLOYEE_ID })).rejects.toMatchObject({ statusCode: 409 });
      expect(attendanceRepository.findByEmployeeAndDate).toHaveBeenCalledWith(EMPLOYEE_ID, '2026-10-26');
    });

    it('creates an open record stamped with the clock', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.findOpenByEmployee.mockResolvedValue(null);
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);

      const record = await useCase.execute({ employeeId: EMPLOYEE_ID, notes: '' });

      expect(record).toMatchObject({ employeeId: EMPLOYEE_ID, date: '2026-10-26', checkIn: NOW, checkOut: null, notes: null });
    });
  });

  describe('CheckOutUseCase', () => {
    const useCase = new CheckOutUseCase(attendanceRepository, employeeRepository, clock);

    it('404 when the employee does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute({ employeeId: EMPLOYEE_ID })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('409 when there is no open entry', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.findOpenByEmployee.mockResolvedValue(null);

      await expect(useCase.execute({ employeeId: EMPLOYEE_ID })).rejects.toMatchObject({ statusCode: 409 });
    });

    it('closes the open record and computes the minutes', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.findOpenByEmployee.mockResolvedValue(makeRecord());

      const record = await useCase.execute({ employeeId: EMPLOYEE_ID });

      expect(record.checkOut).toEqual(NOW);
      expect(record.workedMinutes).toBe(360);
    });

    it('409 when someone else closed the record in the meantime', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.findOpenByEmployee.mockResolvedValue(makeRecord());
      attendanceRepository.closeIfOpen.mockResolvedValue(null);

      await expect(useCase.execute({ employeeId: EMPLOYEE_ID })).rejects.toMatchObject({ statusCode: 409 });
    });

    it('can close an entry opened on a previous day (overnight shift)', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      attendanceRepository.findOpenByEmployee.mockResolvedValue(
        makeRecord({ date: '2026-10-25', checkIn: new Date('2026-10-25T22:00:00Z') }),
      );

      const record = await useCase.execute({ employeeId: EMPLOYEE_ID });

      expect(record.date).toBe('2026-10-25');
      expect(record.workedMinutes).toBe(22 * 60);
    });
  });

  describe('UpdateAttendanceUseCase', () => {
    const useCase = new UpdateAttendanceUseCase(attendanceRepository, clock);

    it('400 when no field is sent or checkIn is null', async () => {
      await expect(useCase.execute(RECORD_ID, {})).rejects.toMatchObject({ statusCode: 400 });
      await expect(useCase.execute(RECORD_ID, { checkIn: null as never })).rejects.toMatchObject({ statusCode: 400 });
    });

    it('404 when the record does not exist', async () => {
      attendanceRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(RECORD_ID, { notes: 'x' })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('400 for times in the future', async () => {
      attendanceRepository.findById.mockResolvedValue(makeRecord());

      await expect(useCase.execute(RECORD_ID, { checkOut: '2026-10-26T21:00:00Z' })).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('400 when the check-out is before the check-in', async () => {
      attendanceRepository.findById.mockResolvedValue(makeRecord());

      await expect(useCase.execute(RECORD_ID, { checkOut: '2026-10-26T13:00:00Z' })).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(attendanceRepository.save).not.toHaveBeenCalled();
    });

    it('corrects the times, recomputes minutes and the business date', async () => {
      attendanceRepository.findById.mockResolvedValue(makeRecord());

      const record = await useCase.execute(RECORD_ID, {
        checkIn: '2026-10-25T13:00:00Z',
        checkOut: '2026-10-25T21:30:00Z',
        notes: 'Corrección',
      });

      expect(record).toMatchObject({ date: '2026-10-25', workedMinutes: 510, notes: 'Corrección' });
    });

    it('409 when reopening a record while another one is open', async () => {
      attendanceRepository.findById.mockResolvedValue(
        makeRecord({ checkOut: new Date('2026-10-26T18:00:00Z'), workedMinutes: 240 }),
      );
      attendanceRepository.findOpenByEmployee.mockResolvedValue(makeRecord({ id: 'other' }));

      await expect(useCase.execute(RECORD_ID, { checkOut: null })).rejects.toMatchObject({ statusCode: 409 });
    });

    it('clears the notes with null', async () => {
      attendanceRepository.findById.mockResolvedValue(makeRecord({ notes: 'algo' }));
      attendanceRepository.findOpenByEmployee.mockResolvedValue(null);

      const record = await useCase.execute(RECORD_ID, { notes: null });

      expect(record.notes).toBeNull();
    });
  });

  describe('DeleteAttendanceUseCase', () => {
    const useCase = new DeleteAttendanceUseCase(attendanceRepository);

    it('404 when the record does not exist', async () => {
      attendanceRepository.delete.mockResolvedValue(false);

      await expect(useCase.execute(RECORD_ID)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('deletes an existing record', async () => {
      attendanceRepository.delete.mockResolvedValue(true);

      await expect(useCase.execute(RECORD_ID)).resolves.toBeUndefined();
    });
  });

  describe('date range validation', () => {
    it('400 when from is after to, before touching the database', async () => {
      const findAll = new FindAllAttendanceUseCase(attendanceRepository);
      const history = new GetEmployeeHistoryUseCase(attendanceRepository, employeeRepository);

      await expect(findAll.execute({ page: 1, pageSize: 10, from: '2026-10-31', to: '2026-10-01' })).rejects.toMatchObject({
        statusCode: 400,
      });
      await expect(
        history.execute({ employeeId: EMPLOYEE_ID, page: 1, pageSize: 10, from: '2026-10-31', to: '2026-10-01' }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(attendanceRepository.findAll).not.toHaveBeenCalled();
      expect(employeeRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('GetEmployeeHistoryUseCase', () => {
    const useCase = new GetEmployeeHistoryUseCase(attendanceRepository, employeeRepository);

    it('404 when the employee does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute({ employeeId: EMPLOYEE_ID, page: 1, pageSize: 10 })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('returns the page and the summary using the same filter', async () => {
      employeeRepository.findById.mockResolvedValue(makeEmployee());
      const page = { items: [], meta: { page: 1, pageSize: 10, pageCount: 1, total: 0 } };
      const summary = { totalRecords: 3, totalWorkedMinutes: 1200, openRecords: 1 };
      attendanceRepository.findAll.mockResolvedValue(page);
      attendanceRepository.summarize.mockResolvedValue(summary);

      const result = await useCase.execute({
        employeeId: EMPLOYEE_ID,
        page: 1,
        pageSize: 10,
        from: '2026-10-01',
        to: '2026-10-31',
        status: 'closed',
      });

      expect(result).toEqual({ records: page, summary });
      expect(attendanceRepository.summarize).toHaveBeenCalledWith({
        employeeId: EMPLOYEE_ID,
        from: '2026-10-01',
        to: '2026-10-31',
        status: 'closed',
      });
    });
  });
});
