import { AppError } from '../../../shared/errors/AppError';
import type { Employee, EmployeeSummary } from '../../employee/domain/employee.entity';

export interface PublicAttendance {
  id: string;
  employee?: EmployeeSummary;
  employeeId?: string;
  date: string;
  checkIn: Date;
  checkOut: Date | null;
  workedMinutes: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Attendance {
  id: string = '';
  employeeId: string = '';
  employee?: Employee;
  date: string = '';
  checkIn: Date = new Date();
  checkOut: Date | null = null;
  workedMinutes: number | null = null;
  notes: string | null = null;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  get isOpen(): boolean {
    return this.checkOut === null;
  }

  close(at: Date): void {
    this.correct(this.checkIn, at);
  }

  correct(checkIn: Date, checkOut: Date | null): void {
    if (checkOut && checkOut.getTime() <= checkIn.getTime()) {
      throw new AppError('La hora de salida debe ser posterior a la hora de entrada', 400);
    }

    this.checkIn = checkIn;
    this.checkOut = checkOut;
    this.workedMinutes = checkOut ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000) : null;
  }

  toPublic(): PublicAttendance {
    return {
      id: this.id,
      ...(this.employee ? { employee: this.employee.toSummary() } : { employeeId: this.employeeId }),
      date: this.date,
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      workedMinutes: this.workedMinutes,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
