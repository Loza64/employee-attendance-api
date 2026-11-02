import { registerDecorator, ValidationOptions } from 'class-validator';
import { isCalendarDate } from './calendar-date.validator';

const OFFSET_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,3})?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/;

export const isOffsetDateTime = (value: unknown): value is string =>
  typeof value === 'string' &&
  OFFSET_DATE_TIME.test(value) &&
  isCalendarDate(value.slice(0, 10)) &&
  !Number.isNaN(Date.parse(value));

export const IsOffsetDateTime =
  (options?: ValidationOptions) =>
  (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isOffsetDateTime',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} debe ser una fecha y hora ISO 8601 con zona horaria (por ejemplo 2026-10-26T08:00:00-06:00 o ...Z)`,
        ...options,
      },
      validator: { validate: isOffsetDateTime },
    });
  };
