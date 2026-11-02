import { Router } from 'express';
import { validateDTO } from '../../../../shared/middlewares/validate-dto.middleware';
import { validateObjectIdParam } from '../../../../shared/middlewares/validate-object-id-param.middleware';
import { validateQuery } from '../../../../shared/middlewares/validate-query.middleware';
import { AttendanceHistoryQueryDto } from '../../../attendance/application/attendance-query.dto';
import { AttendanceController } from '../../../attendance/infrastructure/http/attendance.controller';
import { CreateEmployeeDto } from '../../application/create-employee.dto';
import { EmployeeQueryDto } from '../../application/employee-query.dto';
import { UpdateEmployeeDto } from '../../application/update-employee.dto';
import { EmployeeController } from './employee.controller';

export const buildEmployeeRouter = (
  controller: EmployeeController,
  attendanceController: AttendanceController,
): Router => {
  const router = Router();

  router.param('id', validateObjectIdParam);

  /**
   * @swagger
   * /api/employees:
   *   post:
   *     summary: Registra un empleado
   *     tags: [Employees]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateEmployeeDto'
   *     responses:
   *       201:
   *         description: Empleado creado
   *       400:
   *         description: Error de validación
   *       409:
   *         description: Código de empleado o email ya registrados
   */
  router.post('/', validateDTO(CreateEmployeeDto), controller.create);

  /**
   * @swagger
   * /api/employees:
   *   get:
   *     summary: Lista empleados (paginado)
   *     tags: [Employees]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: search
   *         description: Busca en nombre, código y email
   *         schema: { type: string }
   *       - in: query
   *         name: department
   *         schema: { type: string }
   *       - in: query
   *         name: isActive
   *         schema: { type: boolean }
   *     responses:
   *       200:
   *         description: Listado paginado de empleados
   *       400:
   *         description: Parámetros de consulta inválidos
   */
  router.get('/', validateQuery(EmployeeQueryDto), controller.findAll);

  /**
   * @swagger
   * /api/employees/{id}:
   *   get:
   *     summary: Obtiene un empleado
   *     tags: [Employees]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Empleado encontrado
   *       400:
   *         description: Id inválido
   *       404:
   *         description: Empleado no encontrado
   */
  router.get('/:id', controller.findOne);

  /**
   * @swagger
   * /api/employees/{id}/attendance:
   *   get:
   *     summary: Historial de asistencia de un empleado, con resumen de minutos trabajados
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: from
   *         description: Fecha inicial inclusive (YYYY-MM-DD)
   *         schema: { type: string, example: '2026-10-01' }
   *       - in: query
   *         name: to
   *         description: Fecha final inclusive (YYYY-MM-DD)
   *         schema: { type: string, example: '2026-10-31' }
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [open, closed] }
   *     responses:
   *       200:
   *         description: Registros paginados y resumen (totalRecords, totalWorkedMinutes, openRecords)
   *       400:
   *         description: Parámetros inválidos
   *       404:
   *         description: Empleado no encontrado
   */
  router.get('/:id/attendance', validateQuery(AttendanceHistoryQueryDto), attendanceController.history);

  /**
   * @swagger
   * /api/employees/{id}:
   *   patch:
   *     summary: Actualiza los datos de un empleado (incluye activarlo o desactivarlo)
   *     tags: [Employees]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateEmployeeDto'
   *     responses:
   *       200:
   *         description: Empleado actualizado
   *       400:
   *         description: Error de validación
   *       404:
   *         description: Empleado no encontrado
   *       409:
   *         description: Email ya registrado
   */
  router.patch('/:id', validateDTO(UpdateEmployeeDto), controller.update);

  /**
   * @swagger
   * /api/employees/{id}:
   *   delete:
   *     summary: Elimina un empleado sin registros de asistencia
   *     tags: [Employees]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204:
   *         description: Empleado eliminado
   *       400:
   *         description: Id inválido
   *       404:
   *         description: Empleado no encontrado
   *       409:
   *         description: Tiene registros de asistencia; desactívalo en su lugar
   */
  router.delete('/:id', controller.remove);

  return router;
};
