import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDatabaseUrl, getDirectUrl, validateEnv } from "@/lib/env";

describe("Environment Configuration (lib/env)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    expect(() => getDatabaseUrl()).toThrowError("DATABASE_URL is required");
  });

  it("returns DATABASE_URL when present", () => {
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/testdb";
    expect(getDatabaseUrl()).toBe("postgresql://test:test@localhost:5432/testdb");
  });

  it("defaults DIRECT_URL to DATABASE_URL if DIRECT_URL is absent", () => {
    delete process.env.DIRECT_URL;
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/testdb";
    expect(getDirectUrl()).toBe("postgresql://test:test@localhost:5432/testdb");
  });

  it("returns DIRECT_URL when explicitly set", () => {
    process.env.DATABASE_URL = "postgresql://test:test@localhost:6543/testdb?pgbouncer=true";
    process.env.DIRECT_URL = "postgresql://test:test@localhost:5432/testdb";
    expect(getDirectUrl()).toBe("postgresql://test:test@localhost:5432/testdb");
  });

  it("validates valid environment configuration successfully via Zod", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.DIRECT_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.RATE_LIMIT_SALT = "a-very-secure-salt-for-rate-limiting-01";
    process.env.CRON_SECRET = "a-very-secure-cron-secret-token-01";

    const config = validateEnv();
    expect(config.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
    expect(config.DIRECT_URL).toBe("postgresql://user:pass@localhost:5432/db");
  });

  it("fails validation when DATABASE_URL is not a valid URL", () => {
    process.env.DATABASE_URL = "invalid-url-string";
    expect(() => validateEnv()).toThrow();
  });
});
