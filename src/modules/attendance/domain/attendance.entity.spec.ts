import { Employee } from '../../employee/domain/employee.entity';
import { Attendance } from './attendance.entity';

const at = (iso: string) => new Date(iso);

describe('Attendance', () => {
  const makeOpen = () =>
    Object.assign(new Attendance(), { id: 'a1', employeeId: 'e1', date: '2026-10-26', checkIn: at('2026-10-26T14:00:00Z') });

  it('starts open without worked minutes', () => {
    const attendance = makeOpen();

    expect(attendance.isOpen).toBe(true);
    expect(attendance.workedMinutes).toBeNull();
  });

  it('closing computes the worked minutes', () => {
    const attendance = makeOpen();

    attendance.close(at('2026-10-26T22:30:00Z'));

    expect(attendance.isOpen).toBe(false);
    expect(attendance.workedMinutes).toBe(510);
  });

  it('rejects a check-out that is not after the check-in', () => {
    const attendance = makeOpen();

    expect(() => attendance.close(at('2026-10-26T14:00:00Z'))).toThrow(expect.objectContaining({ statusCode: 400 }));
    expect(() => attendance.close(at('2026-10-26T13:00:00Z'))).toThrow(expect.objectContaining({ statusCode: 400 }));
    expect(attendance.isOpen).toBe(true);
  });

  it('a correction recomputes the minutes and can reopen the record', () => {
    const attendance = makeOpen();
    attendance.close(at('2026-10-26T22:00:00Z'));

    attendance.correct(at('2026-10-26T15:00:00Z'), at('2026-10-26T22:00:00Z'));
    expect(attendance.workedMinutes).toBe(420);

    attendance.correct(at('2026-10-26T15:00:00Z'), null);
    expect(attendance.isOpen).toBe(true);
    expect(attendance.workedMinutes).toBeNull();
  });

  it('exposes the employee summary when loaded and only the id otherwise', () => {
    const attendance = makeOpen();
    expect(attendance.toPublic()).toMatchObject({ employeeId: 'e1' });
    expect(attendance.toPublic()).not.toHaveProperty('employee');

    attendance.employee = Object.assign(new Employee(), {
      id: 'e1',
      employeeCode: 'EMP-001',
      name: 'Ana',
      email: 'ana@example.com',
      department: 'IT',
      position: 'Dev',
    });
    const publicRecord = attendance.toPublic();

    expect(publicRecord.employee).toEqual({ id: 'e1', employeeCode: 'EMP-001', name: 'Ana', department: 'IT', position: 'Dev' });
    expect(publicRecord).not.toHaveProperty('employeeId');
  });
});
