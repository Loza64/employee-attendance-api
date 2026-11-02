import { AppError } from '../../../shared/errors/AppError';

export const assertValidRange = (from?: string, to?: string): void => {
  if (from && to && from > to) {
    throw new AppError('from no puede ser posterior a to', 400);
  }
};
