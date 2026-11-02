import { CheckInUseCase } from './modules/attendance/application/check-in.use-case';
import { CheckOutUseCase } from './modules/attendance/application/check-out.use-case';
import { DeleteAttendanceUseCase } from './modules/attendance/application/delete-attendance.use-case';
import { FindAllAttendanceUseCase } from './modules/attendance/application/find-all-attendance.use-case';
import { FindAttendanceByIdUseCase } from './modules/attendance/application/find-attendance-by-id.use-case';
import { GetEmployeeHistoryUseCase } from './modules/attendance/application/get-employee-history.use-case';
import { UpdateAttendanceUseCase } from './modules/attendance/application/update-attendance.use-case';
import { AttendanceController } from './modules/attendance/infrastructure/http/attendance.controller';
import { MongooseAttendanceRepository } from './modules/attendance/infrastructure/persistence/mongoose-attendance.repository';
import { SystemClock } from './modules/attendance/infrastructure/system-clock';
import { CreateEmployeeUseCase } from './modules/employee/application/create-employee.use-case';
import { DeleteEmployeeUseCase } from './modules/employee/application/delete-employee.use-case';
import { FindAllEmployeesUseCase } from './modules/employee/application/find-all-employees.use-case';
import { FindEmployeeByIdUseCase } from './modules/employee/application/find-employee-by-id.use-case';
import { UpdateEmployeeUseCase } from './modules/employee/application/update-employee.use-case';
import { EmployeeController } from './modules/employee/infrastructure/http/employee.controller';
import { MongooseEmployeeRepository } from './modules/employee/infrastructure/persistence/mongoose-employee.repository';
import { env } from './shared/config/env';

export const buildContainer = () => {
  const employeeRepository = new MongooseEmployeeRepository();
  const attendanceRepository = new MongooseAttendanceRepository();
  const clock = new SystemClock(env.TIMEZONE);

  const employeeController = new EmployeeController(
    new CreateEmployeeUseCase(employeeRepository),
    new UpdateEmployeeUseCase(employeeRepository),
    new DeleteEmployeeUseCase(employeeRepository, attendanceRepository),
    new FindAllEmployeesUseCase(employeeRepository),
    new FindEmployeeByIdUseCase(employeeRepository),
  );

  const attendanceController = new AttendanceController(
    new CheckInUseCase(attendanceRepository, employeeRepository, clock),
    new CheckOutUseCase(attendanceRepository, employeeRepository, clock),
    new FindAllAttendanceUseCase(attendanceRepository),
    new FindAttendanceByIdUseCase(attendanceRepository),
    new UpdateAttendanceUseCase(attendanceRepository, clock),
    new DeleteAttendanceUseCase(attendanceRepository),
    new GetEmployeeHistoryUseCase(attendanceRepository, employeeRepository),
  );

  return { employeeController, attendanceController };
};

export type Container = ReturnType<typeof buildContainer>;
