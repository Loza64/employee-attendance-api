import { Router } from 'express';
import { Container } from '../../composition-root';
import { buildAttendanceRouter } from '../../modules/attendance/infrastructure/http/attendance.routes';
import { buildEmployeeRouter } from '../../modules/employee/infrastructure/http/employee.routes';

export const buildApiRouter = (container: Container): Router => {
  const router = Router();

  router.use('/employees', buildEmployeeRouter(container.employeeController, container.attendanceController));
  router.use('/attendance', buildAttendanceRouter(container.attendanceController));

  return router;
};
