import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid direct PostgreSQL connection URL").optional(),
  RATE_LIMIT_SALT: z.string().min(16, "RATE_LIMIT_SALT must be at least 16 characters long").optional(),
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters long").optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is required before database access can be used.");
  }
  return value;
}

export function getDirectUrl(): string {
  return process.env.DIRECT_URL ?? getDatabaseUrl();
}

export function validateEnv(): EnvConfig {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT,
    CRON_SECRET: process.env.CRON_SECRET,
  });
}
