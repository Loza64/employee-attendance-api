import { model, PaginateModel, Schema, Types } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface EmployeeDocument {
  _id: Types.ObjectId;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<EmployeeDocument>(
  {
    employeeCode: { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 3, maxlength: 20 },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    department: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    position: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    hireDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, versionKey: false },
);

employeeSchema.index({ isActive: 1, department: 1 });
employeeSchema.plugin(mongoosePaginate);

export const EmployeeModel = model<EmployeeDocument, PaginateModel<EmployeeDocument>>('Employee', employeeSchema);
