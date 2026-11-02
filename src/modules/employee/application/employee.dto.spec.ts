import 'reflect-metadata';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';
import { EmployeeQueryDto } from './employee-query.dto';
import { UpdateEmployeeDto } from './update-employee.dto';

const check = <T extends object>(dto: ClassConstructor<T>, body: unknown) =>
  validate(plainToInstance(dto, body), { whitelist: true, forbidNonWhitelisted: true });

describe('employee DTOs', () => {
  const valid = {
    employeeCode: 'emp-001',
    name: '  Ana Lopez ',
    email: ' ANA@Example.com ',
    department: 'IT',
    position: 'Developer',
    hireDate: '2026-01-15',
  };

  describe('CreateEmployeeDto', () => {
    it('accepts a valid employee and normalizes code, name and email', async () => {
      expect(await check(CreateEmployeeDto, valid)).toHaveLength(0);

      const dto = plainToInstance(CreateEmployeeDto, valid);
      expect(dto).toMatchObject({ employeeCode: 'EMP-001', name: 'Ana Lopez', email: 'ana@example.com' });
    });

    it.each([
      ['missing name', { ...valid, name: undefined }],
      ['name too short', { ...valid, name: 'A' }],
      ['invalid email', { ...valid, email: 'nope' }],
      ['code too short', { ...valid, employeeCode: 'E1' }],
      ['code with spaces', { ...valid, employeeCode: 'EMP 001' }],
      ['hireDate wrong format', { ...valid, hireDate: '15/01/2026' }],
      ['hireDate impossible', { ...valid, hireDate: '2026-02-30' }],
      ['hireDate with time', { ...valid, hireDate: '2026-01-15T00:00:00Z' }],
      ['missing department', { ...valid, department: undefined }],
      ['unknown field', { ...valid, isActive: false }],
    ])('rejects: %s', async (_label, body) => {
      expect((await check(CreateEmployeeDto, body)).length).toBeGreaterThan(0);
    });
  });

  describe('UpdateEmployeeDto', () => {
    it('accepts partial updates including isActive', async () => {
      expect(await check(UpdateEmployeeDto, { position: 'Lead' })).toHaveLength(0);
      expect(await check(UpdateEmployeeDto, { isActive: false })).toHaveLength(0);
    });

    it('rejects the immutable employeeCode and invalid values', async () => {
      expect((await check(UpdateEmployeeDto, { employeeCode: 'NEW-1' })).length).toBeGreaterThan(0);
      expect((await check(UpdateEmployeeDto, { isActive: 'no' })).length).toBeGreaterThan(0);
      expect((await check(UpdateEmployeeDto, { hireDate: '2026-13-01' })).length).toBeGreaterThan(0);
    });
  });

  describe('EmployeeQueryDto', () => {
    it('converts isActive from the query string', async () => {
      expect(plainToInstance(EmployeeQueryDto, { isActive: 'true' }).isActive).toBe(true);
      expect(plainToInstance(EmployeeQueryDto, { isActive: 'false' }).isActive).toBe(false);
      expect(await check(EmployeeQueryDto, { isActive: 'false', department: 'IT', page: '2' })).toHaveLength(0);
    });

    it('rejects an invalid isActive', async () => {
      expect((await check(EmployeeQueryDto, { isActive: 'maybe' })).length).toBeGreaterThan(0);
    });
  });
});
