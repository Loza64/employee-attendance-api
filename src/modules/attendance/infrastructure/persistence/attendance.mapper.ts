import { Types } from 'mongoose';
import { toEmployeeDomain } from '../../../employee/infrastructure/persistence/employee.mapper';
import { Attendance } from '../../domain/attendance.entity';
import type { AttendanceDocument } from './attendance.schema';

export const toAttendanceDomain = (doc: AttendanceDocument): Attendance => {
  const attendance = Object.assign(new Attendance(), {
    id: doc._id.toString(),
    date: doc.date,
    checkIn: doc.checkIn,
    checkOut: doc.checkOut ?? null,
    workedMinutes: doc.workedMinutes ?? null,
    notes: doc.notes ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });

  if (doc.employee instanceof Types.ObjectId) {
    attendance.employeeId = doc.employee.toString();
  } else {
    attendance.employeeId = doc.employee._id.toString();
    attendance.employee = toEmployeeDomain(doc.employee);
  }

  return attendance;
};
