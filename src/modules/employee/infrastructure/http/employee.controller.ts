import { NextFunction, Request, Response } from 'express';
import { buildPaginatedResponse } from '../../../../shared/pagination/paginate.util';
import { CreateEmployeeUseCase } from '../../application/create-employee.use-case';
import { DeleteEmployeeUseCase } from '../../application/delete-employee.use-case';
import { EmployeeQueryDto } from '../../application/employee-query.dto';
import { FindAllEmployeesUseCase } from '../../application/find-all-employees.use-case';
import { FindEmployeeByIdUseCase } from '../../application/find-employee-by-id.use-case';
import { UpdateEmployeeUseCase } from '../../application/update-employee.use-case';

export class EmployeeController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
    private readonly deleteEmployeeUseCase: DeleteEmployeeUseCase,
    private readonly findAllEmployeesUseCase: FindAllEmployeesUseCase,
    private readonly findEmployeeByIdUseCase: FindEmployeeByIdUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await this.createEmployeeUseCase.execute(req.body);
      res.status(201).json({ data: employee.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize, search, department, isActive } = req.validatedQuery as EmployeeQueryDto;
      const result = await this.findAllEmployeesUseCase.execute({ page, pageSize, search, department, isActive });
      res.status(200).json(buildPaginatedResponse(result, (employee) => employee.toPublic()));
    } catch (err) {
      next(err);
    }
  };

  findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await this.findEmployeeByIdUseCase.execute(String(req.params.id));
      res.status(200).json({ data: employee.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await this.updateEmployeeUseCase.execute(String(req.params.id), req.body);
      res.status(200).json({ data: employee.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteEmployeeUseCase.execute(String(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
