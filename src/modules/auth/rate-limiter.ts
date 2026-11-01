import "server-only";
import { getAuthSecret } from "@/lib/env";
import { hashWithPepper } from "./crypto";
import type { IAuthRepository } from "./store";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export class SlidingWindowRateLimiter {
  constructor(private readonly pepper = getAuthSecret()) {}

  /**
   * Generates a privacy-preserving identifier hash for rate limiting.
   */
  hashKey(identifier: string, context: string): string {
    return hashWithPepper(`ratelimit:${context}:${identifier.toLowerCase().trim()}`, this.pepper);
  }

  /**
   * Checks whether the current rate limit has been exceeded, and records the event if allowed.
   */
  async checkAndRecord(
    key: string,
    context: string,
    limit: number,
    windowSeconds: number,
    repo: IAuthRepository
  ): Promise<RateLimitResult> {
    const keyHash = this.hashKey(key, context);
    const windowStart = new Date(Date.now() - windowSeconds * 1000);

    const currentCount = await repo.countRateLimitEvents(keyHash, windowStart);

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: windowSeconds,
      };
    }

    await repo.recordRateLimitEvent(keyHash);

    return {
      allowed: true,
      remaining: Math.max(0, limit - currentCount - 1),
      retryAfterSeconds: 0,
    };
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();
