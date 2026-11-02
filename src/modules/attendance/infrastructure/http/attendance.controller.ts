import { NextFunction, Request, Response } from 'express';
import { buildPaginatedResponse } from '../../../../shared/pagination/paginate.util';
import { AttendanceHistoryQueryDto, AttendanceQueryDto } from '../../application/attendance-query.dto';
import { CheckInUseCase } from '../../application/check-in.use-case';
import { CheckOutUseCase } from '../../application/check-out.use-case';
import { DeleteAttendanceUseCase } from '../../application/delete-attendance.use-case';
import { FindAllAttendanceUseCase } from '../../application/find-all-attendance.use-case';
import { FindAttendanceByIdUseCase } from '../../application/find-attendance-by-id.use-case';
import { GetEmployeeHistoryUseCase } from '../../application/get-employee-history.use-case';
import { UpdateAttendanceUseCase } from '../../application/update-attendance.use-case';

export class AttendanceController {
  constructor(
    private readonly checkInUseCase: CheckInUseCase,
    private readonly checkOutUseCase: CheckOutUseCase,
    private readonly findAllAttendanceUseCase: FindAllAttendanceUseCase,
    private readonly findAttendanceByIdUseCase: FindAttendanceByIdUseCase,
    private readonly updateAttendanceUseCase: UpdateAttendanceUseCase,
    private readonly deleteAttendanceUseCase: DeleteAttendanceUseCase,
    private readonly getEmployeeHistoryUseCase: GetEmployeeHistoryUseCase,
  ) {}

  checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attendance = await this.checkInUseCase.execute(req.body);
      res.status(201).json({ data: attendance.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attendance = await this.checkOutUseCase.execute(req.body);
      res.status(200).json({ data: attendance.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize, employeeId, from, to, status } = req.validatedQuery as AttendanceQueryDto;
      const result = await this.findAllAttendanceUseCase.execute({ page, pageSize, employeeId, from, to, status });
      res.status(200).json(buildPaginatedResponse(result, (attendance) => attendance.toPublic()));
    } catch (err) {
      next(err);
    }
  };

  findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attendance = await this.findAttendanceByIdUseCase.execute(String(req.params.id));
      res.status(200).json({ data: attendance.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attendance = await this.updateAttendanceUseCase.execute(String(req.params.id), req.body);
      res.status(200).json({ data: attendance.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteAttendanceUseCase.execute(String(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  history = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize, from, to, status } = req.validatedQuery as AttendanceHistoryQueryDto;
      const { records, summary } = await this.getEmployeeHistoryUseCase.execute({
        employeeId: String(req.params.id),
        page,
        pageSize,
        from,
        to,
        status,
      });
      res.status(200).json({ ...buildPaginatedResponse(records, (attendance) => attendance.toPublic()), summary });
    } catch (err) {
      next(err);
    }
  };
}
