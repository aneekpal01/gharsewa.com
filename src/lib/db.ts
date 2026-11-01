import "server-only";
import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb(): PrismaClient {
  getDatabaseUrl();
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export const db = getDb;

let dbStatusCache: { isConnected: boolean; timestamp: number } | null = null;

export async function checkDatabaseConnection(ttlMs = 10000): Promise<boolean> {
  const now = Date.now();
  if (dbStatusCache && now - dbStatusCache.timestamp < ttlMs) {
    return dbStatusCache.isConnected;
  }

  try {
    const client = getDb();
    await Promise.race([
      client.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB connection timeout")), 500)
      ),
    ]);
    dbStatusCache = { isConnected: true, timestamp: now };
    return true;
  } catch {
    dbStatusCache = { isConnected: false, timestamp: now };
    return false;
  }
}
