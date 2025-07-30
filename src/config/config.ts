import { z } from 'zod';

const configSchema = z.object({
  PORT: z.string().transform(Number).default(3939),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default(5432),
  JWT_SECRET: z.string().default('your-secret-key'),
  JWT_REFRESH_SECRET: z.string().default('your-refresh-secret-key'),

  NODE_ENV: z.enum(['development', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_FILE_LOGGING: z.string().default('false'),
  REDIS_URL: z.string().default('http://localhost:6379'),
  REDIS_PASSWORD: z.string().default(''),
});

export const config = configSchema.parse(process.env);