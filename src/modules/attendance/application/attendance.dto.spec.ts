import 'reflect-metadata';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AttendanceHistoryQueryDto, AttendanceQueryDto } from './attendance-query.dto';
import { CheckInDto } from './check-in.dto';
import { CheckOutDto } from './check-out.dto';
import { UpdateAttendanceDto } from './update-attendance.dto';

const check = <T extends object>(dto: ClassConstructor<T>, body: unknown) =>
  validate(plainToInstance(dto, body), { whitelist: true, forbidNonWhitelisted: true });

const EMPLOYEE_ID = '507f1f77bcf86cd799439011';

describe('attendance DTOs', () => {
  it('validates check-in and check-out bodies', async () => {
    expect(await check(CheckInDto, { employeeId: EMPLOYEE_ID, notes: 'Entrada' })).toHaveLength(0);
    expect(await check(CheckOutDto, { employeeId: EMPLOYEE_ID })).toHaveLength(0);

    expect((await check(CheckInDto, {})).length).toBeGreaterThan(0);
    expect((await check(CheckInDto, { employeeId: 'abc' })).length).toBeGreaterThan(0);
    expect((await check(CheckInDto, { employeeId: EMPLOYEE_ID, checkIn: '2026-10-26T08:00:00Z' })).length).toBeGreaterThan(0);
    expect((await check(CheckInDto, { employeeId: EMPLOYEE_ID, notes: 'x'.repeat(501) })).length).toBeGreaterThan(0);
    expect((await check(CheckOutDto, { employeeId: EMPLOYEE_ID, notes: 'x' })).length).toBeGreaterThan(0);
  });

  describe('UpdateAttendanceDto', () => {
    it.each([
      { checkIn: '2026-10-26T08:00:00-06:00' },
      { checkOut: '2026-10-26T17:00:00Z' },
      { checkOut: null },
      { notes: null },
      { checkIn: '2026-10-26T08:00:00.500Z', checkOut: '2026-10-26T17:00:00.000+00:00', notes: 'ok' },
    ])('accepts %j', async (body) => {
      expect(await check(UpdateAttendanceDto, body)).toHaveLength(0);
    });

    it.each([
      ['no time zone', { checkIn: '2026-10-26T08:00:00' }],
      ['date only', { checkIn: '2026-10-26' }],
      ['not a date', { checkOut: 'ayer' }],
      ['impossible date', { checkIn: '2026-02-30T08:00:00Z' }],
      ['hour 24', { checkIn: '2026-10-26T24:00:00Z' }],
      ['minute 60', { checkOut: '2026-10-26T08:60:00Z' }],
      ['offset out of range', { checkOut: '2026-10-26T08:00:00+25:00' }],
      ['unknown field', { employeeId: EMPLOYEE_ID }],
    ])('rejects: %s', async (_label, body) => {
      expect((await check(UpdateAttendanceDto, body)).length).toBeGreaterThan(0);
    });
  });

  describe('queries', () => {
    it('accepts valid filters', async () => {
      expect(
        await check(AttendanceQueryDto, { employeeId: EMPLOYEE_ID, from: '2026-10-01', to: '2026-10-31', status: 'open', page: '2' }),
      ).toHaveLength(0);
      expect(await check(AttendanceHistoryQueryDto, { status: 'closed' })).toHaveLength(0);
    });

    it.each([
      ['invalid employeeId', { employeeId: 'abc' }],
      ['invalid from', { from: '2026-10-32' }],
      ['wrong date format', { to: '31/10/2026' }],
      ['unknown status', { status: 'late' }],
      ['pageSize too big', { pageSize: '500' }],
    ])('rejects: %s', async (_label, body) => {
      expect((await check(AttendanceQueryDto, body)).length).toBeGreaterThan(0);
    });

    it('does not accept employeeId on the history query', async () => {
      expect((await check(AttendanceHistoryQueryDto, { employeeId: EMPLOYEE_ID })).length).toBeGreaterThan(0);
    });
  });
});
