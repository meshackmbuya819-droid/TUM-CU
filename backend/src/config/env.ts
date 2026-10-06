import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('/api/v1'),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('tecump'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('tecump'),
  DB_CONNECTION_LIMIT: z.coerce.number().default(10),
  DB_QUEUE_LIMIT: z.coerce.number().default(100),
  DB_CONNECT_TIMEOUT_MS: z.coerce.number().default(10_000),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().default(60_000),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().default('tumcu-tecump-jwt-access-secret-32-chars-long-secure-key'),
  JWT_REFRESH_SECRET: z.string().default('tumcu-tecump-jwt-refresh-secret-32-chars-long-secure-key'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  AUTH_COOKIE_NAME: z.string().default('tecump_refresh'),
  AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),
  AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173,*'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(3000),

  // All optional: if SMTP_HOST is unset, the notification dispatcher logs
  // emails to the console instead of sending them — safe default for local
  // development, but every queued notification still gets processed and
  // marked sent so nothing silently piles up unsent.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('TUMCU Christian Union <tumchristianunion@gmail.com>'),
  NOTIFICATION_DISPATCH_INTERVAL_MS: z.coerce.number().default(30000),
  UPLOAD_DIR: z.string().default('/app/data/uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast: an invalid/missing configuration must never reach runtime.
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

if (env.NODE_ENV === 'production') {
  if (env.AUTH_COOKIE_SAME_SITE === 'none' && !env.AUTH_COOKIE_SECURE) {
    throw new Error('Production AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true.');
  }
  const insecureDefaults = [
    'tumcu-tecump-jwt-access-secret-32-chars-long-secure-key',
    'tumcu-tecump-jwt-refresh-secret-30d',
    'tumcu-tecump-jwt-refresh-secret-32-chars-long-secure-key',
  ];
  if (
    insecureDefaults.includes(env.JWT_ACCESS_SECRET) ||
    insecureDefaults.includes(env.JWT_REFRESH_SECRET)
  ) {
    throw new Error('Production JWT secrets must be replaced with unique random secrets.');
  }
  if (env.CORS_ORIGIN.split(',').some((origin) => origin.trim() === '*')) {
    throw new Error('Production CORS_ORIGIN must contain explicit trusted origins; wildcard * is not allowed.');
  }
}
