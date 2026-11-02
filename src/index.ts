import { createApp } from './app';
import { buildContainer } from './composition-root';
import { AttendanceModel } from './modules/attendance/infrastructure/persistence/attendance.schema';
import { EmployeeModel } from './modules/employee/infrastructure/persistence/employee.schema';
import { assertEnv, env } from './shared/config/env';
import { connectMongo, disconnectMongo } from './shared/database/mongo';
import { errorLog, serverLog, swaggerLog } from './shared/logger/logger';

const bootstrap = async (): Promise<void> => {
  assertEnv();

  await connectMongo();
  await Promise.all([EmployeeModel.init(), AttendanceModel.init()]);

  const app = createApp(buildContainer());

  const server = app.listen(env.PORT, () => {
    serverLog(`Running on http://localhost:${env.PORT}`);
    swaggerLog(`Available on http://localhost:${env.PORT}/api-docs`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    serverLog('Recibida %s, cerrando de forma ordenada...', signal);
    server.close();
    await disconnectMongo();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

bootstrap().catch((err) => {
  errorLog('Failed to start the server: %O', err);
  process.exit(1);
});
