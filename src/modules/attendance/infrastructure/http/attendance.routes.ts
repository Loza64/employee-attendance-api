import { Router } from 'express';
import { validateDTO } from '../../../../shared/middlewares/validate-dto.middleware';
import { validateObjectIdParam } from '../../../../shared/middlewares/validate-object-id-param.middleware';
import { validateQuery } from '../../../../shared/middlewares/validate-query.middleware';
import { AttendanceQueryDto } from '../../application/attendance-query.dto';
import { CheckInDto } from '../../application/check-in.dto';
import { CheckOutDto } from '../../application/check-out.dto';
import { UpdateAttendanceDto } from '../../application/update-attendance.dto';
import { AttendanceController } from './attendance.controller';

export const buildAttendanceRouter = (controller: AttendanceController): Router => {
  const router = Router();

  router.param('id', validateObjectIdParam);

  /**
   * @swagger
   * /api/attendance/check-in:
   *   post:
   *     summary: Registra la entrada de un empleado (fecha y hora actuales del servidor)
   *     tags: [Attendance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CheckInDto'
   *     responses:
   *       201:
   *         description: Entrada registrada
   *       400:
   *         description: Error de validación
   *       404:
   *         description: Empleado no encontrado
   *       409:
   *         description: Empleado inactivo, entrada ya abierta o asistencia ya registrada en la fecha
   */
  router.post('/check-in', validateDTO(CheckInDto), controller.checkIn);

  /**
   * @swagger
   * /api/attendance/check-out:
   *   post:
   *     summary: Registra la salida de un empleado y calcula los minutos trabajados
   *     tags: [Attendance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CheckOutDto'
   *     responses:
   *       200:
   *         description: Salida registrada
   *       400:
   *         description: Error de validación
   *       404:
   *         description: Empleado no encontrado
   *       409:
   *         description: El empleado no tiene una entrada abierta
   */
  router.post('/check-out', validateDTO(CheckOutDto), controller.checkOut);

  /**
   * @swagger
   * /api/attendance:
   *   get:
   *     summary: Lista registros de asistencia (paginado, más recientes primero)
   *     tags: [Attendance]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: employeeId
   *         schema: { type: string }
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
   *         description: open (sin salida) o closed (con salida)
   *         schema: { type: string, enum: [open, closed] }
   *     responses:
   *       200:
   *         description: Listado paginado
   *       400:
   *         description: Parámetros de consulta inválidos
   */
  router.get('/', validateQuery(AttendanceQueryDto), controller.findAll);

  /**
   * @swagger
   * /api/attendance/{id}:
   *   get:
   *     summary: Obtiene un registro de asistencia
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Registro encontrado
   *       400:
   *         description: Id inválido
   *       404:
   *         description: Registro no encontrado
   */
  router.get('/:id', controller.findOne);

  /**
   * @swagger
   * /api/attendance/{id}:
   *   patch:
   *     summary: Corrige la hora de entrada o salida, o las notas de un registro
   *     tags: [Attendance]
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
   *             $ref: '#/components/schemas/UpdateAttendanceDto'
   *     responses:
   *       200:
   *         description: Registro actualizado
   *       400:
   *         description: Validación fallida (salida anterior a la entrada, horas futuras, sin campos)
   *       404:
   *         description: Registro no encontrado
   *       409:
   *         description: Conflicto con otro registro del empleado
   */
  router.patch('/:id', validateDTO(UpdateAttendanceDto), controller.update);

  /**
   * @swagger
   * /api/attendance/{id}:
   *   delete:
   *     summary: Elimina un registro de asistencia
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204:
   *         description: Registro eliminado
   *       400:
   *         description: Id inválido
   *       404:
   *         description: Registro no encontrado
   */
  router.delete('/:id', controller.remove);

  return router;
};
