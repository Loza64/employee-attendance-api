import request from 'supertest';
import { createApp } from '../../../../app';

const ID = '507f1f77bcf86cd799439011';

describe('API routes (validation layer, no database needed)', () => {
  const app = createApp();

  it('GET /api-docs.json documents every endpoint', async () => {
    const res = await request(app).get('/api-docs.json');

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.paths).sort()).toEqual(
      [
        '/api/attendance',
        '/api/attendance/check-in',
        '/api/attendance/check-out',
        '/api/attendance/{id}',
        '/api/employees',
        '/api/employees/{id}',
        '/api/employees/{id}/attendance',
      ].sort(),
    );
  });

  describe('employees', () => {
    const body = {
      employeeCode: 'EMP-001',
      name: 'Ana Lopez',
      email: 'ana@example.com',
      department: 'IT',
      position: 'Developer',
      hireDate: '2026-01-15',
    };

    it('POST rejects invalid bodies', async () => {
      const missing = await request(app).post('/api/employees').send({ ...body, name: undefined });
      const date = await request(app).post('/api/employees').send({ ...body, hireDate: '2026-02-30' });
      const extra = await request(app).post('/api/employees').send({ ...body, isActive: false });

      expect(missing.status).toBe(400);
      expect(missing.body.message).toContain('name');
      expect(date.status).toBe(400);
      expect(date.body.message).toContain('hireDate');
      expect(extra.status).toBe(400);
    });

    it('GET list rejects invalid filters', async () => {
      const res = await request(app).get('/api/employees?isActive=maybe&pageSize=1000');

      expect(res.status).toBe(400);
    });

    it.each([
      ['get', '/api/employees/abc'],
      ['patch', '/api/employees/abc'],
      ['delete', '/api/employees/abc'],
      ['get', '/api/employees/abc/attendance'],
    ] as const)('%s %s rejects an invalid ObjectId', async (method, url) => {
      const res = await request(app)[method](url).send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ObjectId');
    });

    it('PATCH rejects the immutable employeeCode', async () => {
      const res = await request(app).patch(`/api/employees/${ID}`).send({ employeeCode: 'NEW-1' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('employeeCode');
    });
  });

  describe('attendance', () => {
    it.each(['check-in', 'check-out'])('POST /%s requires a valid employeeId', async (action) => {
      const missing = await request(app).post(`/api/attendance/${action}`).send({});
      const invalid = await request(app).post(`/api/attendance/${action}`).send({ employeeId: 'abc' });

      expect(missing.status).toBe(400);
      expect(invalid.status).toBe(400);
      expect(invalid.body.message).toContain('employeeId');
    });

    it('GET list and history reject bad filters', async () => {
      const status = await request(app).get('/api/attendance?status=late');
      const date = await request(app).get('/api/attendance?from=2026-10-40');
      const range = await request(app).get('/api/attendance?from=2026-10-31&to=2026-10-01');
      const history = await request(app).get(`/api/employees/${ID}/attendance?from=2026-10-31&to=2026-10-01`);

      expect(status.status).toBe(400);
      expect(date.status).toBe(400);
      expect(range.status).toBe(400);
      expect(range.body.message).toContain('from');
      expect(history.status).toBe(400);
    });

    it('PATCH rejects bad times, empty bodies and an invalid id', async () => {
      const noZone = await request(app).patch(`/api/attendance/${ID}`).send({ checkIn: '2026-10-26T08:00:00' });
      const empty = await request(app).patch(`/api/attendance/${ID}`).send({});
      const badId = await request(app).patch('/api/attendance/abc').send({ notes: 'x' });

      expect(noZone.status).toBe(400);
      expect(noZone.body.message).toContain('checkIn');
      expect(empty.status).toBe(400);
      expect(badId.status).toBe(400);
      expect(badId.body.message).toContain('ObjectId');
    });

    it.each([
      ['get', '/api/attendance/abc'],
      ['delete', '/api/attendance/abc'],
    ] as const)('%s %s rejects an invalid ObjectId', async (method, url) => {
      const res = await request(app)[method](url);

      expect(res.status).toBe(400);
    });
  });
});
