import { Types } from 'mongoose';
import { MongooseAttendanceRepository } from './mongoose-attendance.repository';
import { AttendanceModel } from './attendance.schema';

describe('MongooseAttendanceRepository', () => {
  const repository = new MongooseAttendanceRepository();
  const employeeId = new Types.ObjectId();

  afterEach(() => jest.restoreAllMocks());

  it('filters by employee, date range and status, and maps the page meta', async () => {
    const now = new Date();
    const paginate = jest.spyOn(AttendanceModel, 'paginate').mockResolvedValue({
      docs: [
        {
          _id: new Types.ObjectId(),
          employee: { _id: employeeId, employeeCode: 'EMP-001', name: 'Ana', department: 'IT', position: 'Dev' },
          date: '2026-10-26',
          checkIn: now,
          checkOut: null,
          workedMinutes: null,
          notes: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      totalDocs: 21,
      limit: 10,
      page: 2,
      totalPages: 3,
    } as never);

    const page = await repository.findAll({
      page: 2,
      pageSize: 10,
      employeeId: employeeId.toString(),
      from: '2026-10-01',
      to: '2026-10-31',
      status: 'open',
    });

    expect(paginate).toHaveBeenCalledWith(
      { employee: employeeId, date: { $gte: '2026-10-01', $lte: '2026-10-31' }, checkOut: null },
      expect.objectContaining({ page: 2, limit: 10, lean: true, sort: { checkIn: -1, _id: -1 } }),
    );
    expect(page.meta).toEqual({ page: 2, pageSize: 10, pageCount: 3, total: 21 });
    expect(page.items[0].toPublic().employee).toMatchObject({ employeeCode: 'EMP-001', name: 'Ana' });
  });

  it('only filters by the bounds that were sent', async () => {
    const paginate = jest.spyOn(AttendanceModel, 'paginate').mockResolvedValue({
      docs: [],
      totalDocs: 0,
      limit: 10,
      page: 1,
      totalPages: 1,
    } as never);

    await repository.findAll({ page: 1, pageSize: 10, from: '2026-10-01', status: 'closed' });

    expect(paginate).toHaveBeenCalledWith(
      { date: { $gte: '2026-10-01' }, checkOut: { $ne: null } },
      expect.any(Object),
    );
  });

  it('summarize returns zeros when nothing matches and casts the employee id for the aggregation', async () => {
    const aggregate = jest.spyOn(AttendanceModel, 'aggregate').mockResolvedValue([] as never);

    const summary = await repository.summarize({ employeeId: employeeId.toString() });

    expect(summary).toEqual({ totalRecords: 0, totalWorkedMinutes: 0, openRecords: 0 });
    expect(aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([{ $match: { employee: employeeId } }]),
    );
  });
});
