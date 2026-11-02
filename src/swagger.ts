import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { buildSwaggerDefinitions } from './shared/swagger/schemas';

const routesGlob = path
  .join(__dirname, 'modules', '**', 'infrastructure', 'http', '*.routes.{ts,js}')
  .replace(/\\/g, '/');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      version: 'v1.0.0',
      title: 'Employee Attendance API',
      description:
        'API REST para registrar empleados, controlar entradas y salidas (check-in / check-out) y consultar el historial de asistencia.',
    },
    servers: [{ url: '/' }],
    components: {
      schemas: buildSwaggerDefinitions(),
    },
  },
  apis: [routesGlob],
  failOnErrors: true,
};

export const swaggerSpec = swaggerJsdoc(options);
