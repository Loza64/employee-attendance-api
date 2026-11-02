import { model, PaginateModel, Schema, Types } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import type { EmployeeSummaryDocument } from '../../../employee/infrastructure/persistence/employee.mapper';

export interface AttendanceDocument {
  _id: Types.ObjectId;
  employee: Types.ObjectId | EmployeeSummaryDocument;
  date: string;
  checkIn: Date;
  checkOut?: Date | null;
  workedMinutes?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<AttendanceDocument>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, default: null },
    workedMinutes: { type: Number, min: 0, default: null },
    notes: { type: String, trim: true, maxlength: 500, default: null },
  },
  { timestamps: true, versionKey: false },
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index(
  { employee: 1 },
  { unique: true, name: 'one_open_record_per_employee', partialFilterExpression: { checkOut: { $type: 'null' } } },
);
attendanceSchema.index({ date: -1, checkIn: -1 });
attendanceSchema.plugin(mongoosePaginate);

export const AttendanceModel = model<AttendanceDocument, PaginateModel<AttendanceDocument>>(
  'Attendance',
  attendanceSchema,
);
