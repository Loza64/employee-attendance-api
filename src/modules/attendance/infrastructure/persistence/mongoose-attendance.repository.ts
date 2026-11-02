import { Types } from 'mongoose';
import { AppError } from '../../../../shared/errors/AppError';
import { duplicateKeyFields, isDuplicateKeyError } from '../../../../shared/database/mongo';
import { Page } from '../../../../shared/pagination/pagination.types';
import { EmployeeModel } from '../../../employee/infrastructure/persistence/employee.schema';
import { Attendance } from '../../domain/attendance.entity';
import {
  AttendanceFilter,
  AttendanceListParams,
  AttendanceRepository,
  AttendanceSummary,
} from '../../domain/attendance.repository';
import { toAttendanceDomain } from './attendance.mapper';
import { AttendanceModel } from './attendance.schema';

const EMPLOYEE_POPULATE = {
  path: 'employee',
  model: EmployeeModel,
  select: 'employeeCode name department position',
};

const buildFilter = ({ employeeId, from, to, status }: AttendanceFilter): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};
  if (employeeId) filter.employee = new Types.ObjectId(employeeId);
  if (from || to) filter.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  if (status === 'open') filter.checkOut = null;
  if (status === 'closed') filter.checkOut = { $ne: null };
  return filter;
};

const toConflict = (err: unknown): AppError =>
  duplicateKeyFields(err).includes('date')
    ? new AppError('El empleado ya registró asistencia en esa fecha', 409)
    : new AppError('El empleado ya tiene una entrada abierta', 409);

export class MongooseAttendanceRepository implements AttendanceRepository {
  async findAll({ page, pageSize, ...filter }: AttendanceListParams): Promise<Page<Attendance>> {
    const result = await AttendanceModel.paginate(buildFilter(filter), {
      page,
      limit: pageSize,
      sort: { checkIn: -1, _id: -1 },
      populate: EMPLOYEE_POPULATE,
      lean: true,
    });

    return {
      items: result.docs.map(toAttendanceDomain),
      meta: {
        page: result.page ?? page,
        pageSize: result.limit,
        pageCount: result.totalPages,
        total: result.totalDocs,
      },
    };
  }

  async summarize(filter: AttendanceFilter): Promise<AttendanceSummary> {
    const [result] = await AttendanceModel.aggregate<AttendanceSummary>([
      { $match: buildFilter(filter) },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalWorkedMinutes: { $sum: { $ifNull: ['$workedMinutes', 0] } },
          openRecords: { $sum: { $cond: [{ $eq: ['$checkOut', null] }, 1, 0] } },
        },
      },
      { $project: { _id: 0 } },
    ]);

    return result ?? { totalRecords: 0, totalWorkedMinutes: 0, openRecords: 0 };
  }

  async findById(id: string): Promise<Attendance | null> {
    const doc = await AttendanceModel.findById(id).populate(EMPLOYEE_POPULATE).lean();
    return doc ? toAttendanceDomain(doc) : null;
  }

  async findOpenByEmployee(employeeId: string): Promise<Attendance | null> {
    const doc = await AttendanceModel.findOne({ employee: employeeId, checkOut: null })
      .sort({ checkIn: -1 })
      .populate(EMPLOYEE_POPULATE)
      .lean();
    return doc ? toAttendanceDomain(doc) : null;
  }

  async findByEmployeeAndDate(employeeId: string, date: string): Promise<Attendance | null> {
    const doc = await AttendanceModel.findOne({ employee: employeeId, date }).populate(EMPLOYEE_POPULATE).lean();
    return doc ? toAttendanceDomain(doc) : null;
  }

  async existsForEmployee(employeeId: string): Promise<boolean> {
    const doc = await AttendanceModel.exists({ employee: employeeId });
    return doc !== null;
  }

  async save(attendance: Attendance): Promise<Attendance> {
    const fields = {
      date: attendance.date,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      workedMinutes: attendance.workedMinutes,
      notes: attendance.notes,
    };

    try {
      if (!attendance.id) {
        const created = await AttendanceModel.create({ ...fields, employee: attendance.employeeId });
        await created.populate(EMPLOYEE_POPULATE);
        return toAttendanceDomain(created.toObject());
      }

      const updated = await AttendanceModel.findByIdAndUpdate(
        attendance.id,
        { $set: fields },
        { new: true, runValidators: true },
      )
        .populate(EMPLOYEE_POPULATE)
        .lean();

      if (!updated) {
        throw new AppError('Registro de asistencia no encontrado', 404);
      }
      return toAttendanceDomain(updated);
    } catch (err) {
      if (isDuplicateKeyError(err)) throw toConflict(err);
      throw err;
    }
  }

  async closeIfOpen(attendance: Attendance): Promise<Attendance | null> {
    const updated = await AttendanceModel.findOneAndUpdate(
      { _id: attendance.id, checkOut: null },
      { $set: { checkOut: attendance.checkOut, workedMinutes: attendance.workedMinutes } },
      { new: true, runValidators: true },
    )
      .populate(EMPLOYEE_POPULATE)
      .lean();

    return updated ? toAttendanceDomain(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { deletedCount } = await AttendanceModel.deleteOne({ _id: id });
    return deletedCount === 1;
  }
}
