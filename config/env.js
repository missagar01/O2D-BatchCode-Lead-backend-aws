const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .default('3005')
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value) && value > 0, 'PORT must be a positive integer'),
  DATABASE_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGINS: z.string().optional(),
  PG_HOST: z.string().optional(),
  PG_PORT: z
    .string()
    .default('5432')
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value) && value > 0, 'PG_PORT must be a positive integer'),
  PG_USER: z.string().optional(),
  PG_PASSWORD: z.string().optional(),
  PG_DATABASE: z.string().optional(),
  PG_NAME: z.string().optional(), // Login database name (checklist-delegation)
  PG_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  DB_HOST: z.string().optional(),
  DB_PORT: z
    .string()
    .transform((value) => (value ? Number(value) : undefined))
    .optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('1d')
});

const parsedEnv = envSchema.parse(process.env);

const config = {
  nodeEnv: parsedEnv.NODE_ENV,
  port: parsedEnv.PORT,
  databaseUrl: parsedEnv.DATABASE_URL,
  logLevel: parsedEnv.LOG_LEVEL,
  corsOrigins: parsedEnv.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? ['*'],
  // Main database for batchcode and lead-to-order (uses DB_* variables)
  postgres: {
    host: parsedEnv.DB_HOST ?? parsedEnv.PG_HOST,
    port: parsedEnv.DB_PORT ?? parsedEnv.PG_PORT ?? 5432,
    user: parsedEnv.DB_USER ?? parsedEnv.PG_USER,
    password: parsedEnv.DB_PASSWORD ?? parsedEnv.PG_PASSWORD,
    database: parsedEnv.DB_NAME ?? parsedEnv.PG_DATABASE,
    ssl: parsedEnv.DB_SSL ?? parsedEnv.PG_SSL
  },
  // Auth/Login database (uses PG_* variables, database name from PG_NAME)
  authDatabase: {
    host: parsedEnv.PG_HOST ?? parsedEnv.DB_HOST,
    port: parsedEnv.PG_PORT ?? parsedEnv.DB_PORT ?? 5432,
    user: parsedEnv.PG_USER ?? parsedEnv.DB_USER,
    password: parsedEnv.PG_PASSWORD ?? parsedEnv.DB_PASSWORD,
    database: parsedEnv.PG_NAME ?? parsedEnv.PG_DATABASE ?? parsedEnv.DB_NAME,
    ssl: parsedEnv.PG_SSL ?? parsedEnv.DB_SSL
  },
  jwt: {
    secret: parsedEnv.JWT_SECRET,
    expiresIn: parsedEnv.JWT_EXPIRES_IN
  }
};

module.exports = config;
