import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid direct PostgreSQL connection URL").optional(),
  RATE_LIMIT_SALT: z.string().min(16, "RATE_LIMIT_SALT must be at least 16 characters long").optional(),
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters long").optional(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters long").optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  OTP_PROVIDER: z.enum(["mock", "twilio", "msg91"]).default("mock"),
  APP_URL: z.string().url().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.RATE_LIMIT_SALT;
  if (!secret) {
    if (isDevFallbackAllowed()) {
      return "gharsewa-default-dev-auth-secret-key-at-least-32-bytes";
    }
    throw new Error("AUTH_SECRET or RATE_LIMIT_SALT must be configured in production.");
  }
  return secret;
}

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

/**
 * Determines whether development/test fallback to mock or seed data is permitted.
 * Strictly forbidden in production environments to prevent exposing dummy data.
 */
export function isDevFallbackAllowed(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test" ||
    process.env.ENABLE_DEV_SEED_FALLBACK === "true"
  );
}

export function validateEnv(): EnvConfig {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT,
    CRON_SECRET: process.env.CRON_SECRET,
  });
}
