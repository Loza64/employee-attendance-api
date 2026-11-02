import { config } from 'dotenv';

config();

export const env = {
  PORT: Number(process.env.PORT) || 4300,
  ORIGIN: process.env.ORIGIN,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',
  MONGO_URI: process.env.MONGO_URI ?? 'mongodb://localhost:27017/attendance_db',
  TIMEZONE: process.env.TIMEZONE ?? 'America/El_Salvador',
};

export const assertEnv = (): void => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: env.TIMEZONE });
  } catch {
    throw new Error(`TIMEZONE no es una zona horaria IANA válida: ${env.TIMEZONE}`);
  }
};
