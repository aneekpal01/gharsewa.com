import "server-only";
import { getAuthSecret, isDevFallbackAllowed } from "@/lib/env";
import {
  generateOtpCode,
  hashOtp,
  hashWithPepper,
  timingSafeEqual,
} from "./crypto";
import { normalizePhoneNumber } from "./schemas";
import { getAuthRepository, type IAuthRepository } from "./store";
import { getOtpProvider, type IOtpProvider } from "./otp-provider";
import { rateLimiter } from "./rate-limiter";
import { sessionService } from "./session-service";
import type { OtpRequestResult, OtpVerifyResult } from "./types";

export const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
export const OTP_COOLDOWN_SECONDS = 60; // 60 seconds resend cooldown
export const OTP_MAX_ATTEMPTS = 3;

// Rate limits
const MAX_OTP_REQUESTS_PER_PHONE = 5;
const MAX_OTP_REQUESTS_PER_IP = 15;
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60; // 15 minutes

export class OtpService {
  constructor(
    private readonly providerGetter: () => IOtpProvider = getOtpProvider,
    private readonly pepperGetter: () => string = getAuthSecret
  ) {}

  /**
   * Hashes a normalized phone number for privacy-preserving storage.
   */
  hashPhone(normalizedPhone: string): string {
    return hashWithPepper(`phone:${normalizedPhone}`, this.pepperGetter());
  }

  /**
   * Requests an OTP for a given mobile number.
   * Enforces:
   * 1. Phone number normalization to E.164.
   * 2. IP and Phone rate limits.
   * 3. 60-second resend cooldown.
   * 4. Account enumeration resistance (same response for existing/new users).
   * 5. Hashed persistence in PostgreSQL.
   */
  async requestOtp(params: {
    phone: string;
    ipAddress?: string | null;
    repo?: IAuthRepository;
  }): Promise<OtpRequestResult> {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
      return { ok: false, error: "INVALID_PHONE" };
    }

    const repo = params.repo ?? (await getAuthRepository());
    const pepper = this.pepperGetter();
    const phoneHash = this.hashPhone(normalizedPhone);

    // Rate limit check: Phone
    const phoneLimit = await rateLimiter.checkAndRecord(
      normalizedPhone,
      "otp_request_phone",
      MAX_OTP_REQUESTS_PER_PHONE,
      RATE_LIMIT_WINDOW_SECONDS,
      repo
    );
    if (!phoneLimit.allowed) {
      return {
        ok: false,
        error: "RATE_LIMITED",
        retryAfterSeconds: phoneLimit.retryAfterSeconds,
      };
    }

    // Rate limit check: IP (if provided)
    if (params.ipAddress) {
      const ipLimit = await rateLimiter.checkAndRecord(
        params.ipAddress,
        "otp_request_ip",
        MAX_OTP_REQUESTS_PER_IP,
        RATE_LIMIT_WINDOW_SECONDS,
        repo
      );
      if (!ipLimit.allowed) {
        return {
          ok: false,
          error: "RATE_LIMITED",
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        };
      }
    }

    // Cooldown check: Look for recent active challenge
    const latestChallenge = await repo.getLatestOtpChallenge(phoneHash);
    const now = Date.now();
    if (latestChallenge && !latestChallenge.usedAt) {
      const elapsedSeconds = Math.floor((now - latestChallenge.createdAt.getTime()) / 1000);
      if (elapsedSeconds < OTP_COOLDOWN_SECONDS) {
        return {
          ok: false,
          error: "COOLDOWN_ACTIVE",
          retryAfterSeconds: OTP_COOLDOWN_SECONDS - elapsedSeconds,
        };
      }
    }

    // Generate code and hash
    const plainOtp = generateOtpCode();
    const otpHash = hashOtp(plainOtp, pepper);
    const expiresAt = new Date(now + OTP_EXPIRY_MS);

    // Save hashed challenge
    await repo.createOtpChallenge({
      phoneHash,
      otpHash,
      expiresAt,
      maxAttempts: OTP_MAX_ATTEMPTS,
      ipAddress: params.ipAddress,
    });

    // Dispatch via provider
    const provider = this.providerGetter();
    await provider.sendOtp({
      phone: normalizedPhone,
      otp: plainOtp,
    });

    await repo.recordAuditLog({
      action: "AUTH_OTP_REQUESTED",
      details: { phoneHash: phoneHash.substring(0, 12) },
      ipAddress: params.ipAddress,
    });

    // Account enumeration resistance: Response reveals nothing about account existence.
    return {
      ok: true,
      cooldownSeconds: OTP_COOLDOWN_SECONDS,
      // Expose devCode only in dev/test for zero-cost automated assertions
      devCode: isDevFallbackAllowed() ? plainOtp : undefined,
    };
  }

  /**
   * Verifies an OTP code and establishes an authenticated customer session.
   * Enforces:
   * 1. Single-use verification (replay protection).
   * 2. Expiration ceiling (5 minutes).
   * 3. Max attempt lockout (3 attempts).
   * 4. Safe timing-safe comparison.
   * 5. Customer profile initialization.
   */
  async verifyOtp(params: {
    phone: string;
    otp: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    repo?: IAuthRepository;
  }): Promise<OtpVerifyResult> {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    const repo = params.repo ?? (await getAuthRepository());
    const pepper = this.pepperGetter();
    const phoneHash = this.hashPhone(normalizedPhone);

    const challenge = await repo.getLatestOtpChallenge(phoneHash);
    if (!challenge) {
      return { ok: false, error: "EXPIRED_OTP" };
    }

    // Single-use / replay protection check
    if (challenge.usedAt) {
      return { ok: false, error: "EXPIRED_OTP" };
    }

    const now = new Date();

    // Expiry check
    if (now > challenge.expiresAt) {
      return { ok: false, error: "EXPIRED_OTP" };
    }

    // Lockout check
    if (challenge.attempts >= challenge.maxAttempts) {
      return { ok: false, error: "MAX_ATTEMPTS_EXCEEDED" };
    }

    // Hash user-supplied OTP and compare timing-safely
    const candidateHash = hashOtp(params.otp.trim(), pepper);
    const isMatch = timingSafeEqual(candidateHash, challenge.otpHash);

    if (!isMatch) {
      const { attempts, maxAttempts } = await repo.incrementOtpAttempts(challenge.id);
      const attemptsRemaining = Math.max(0, maxAttempts - attempts);

      await repo.recordAuditLog({
        action: "AUTH_OTP_FAILED_ATTEMPT",
        details: { challengeId: challenge.id, attemptsRemaining },
        ipAddress: params.ipAddress,
      });

      if (attempts >= maxAttempts) {
        return { ok: false, error: "MAX_ATTEMPTS_EXCEEDED" };
      }

      return {
        ok: false,
        error: "INVALID_OTP",
        attemptsRemaining,
      };
    }

    // Mark challenge as used atomically (single-use / concurrency-safe claim)
    const claimed = await repo.claimOtpChallenge(challenge.id);
    if (!claimed) {
      return { ok: false, error: "EXPIRED_OTP" };
    }

    // Find or create customer
    let user = await repo.findUserByPhone(normalizedPhone);
    let isNewUser = false;

    if (!user) {
      user = await repo.createUser({
        phone: normalizedPhone,
        phoneVerified: true,
        role: "CUSTOMER",
        isActive: true,
      });
      await repo.ensureCustomerProfile(user.id);
      isNewUser = true;
    } else {
      if (!user.isActive) {
        return { ok: false, error: "USER_DISABLED" };
      }
      if (!user.phoneVerified) {
        user = await repo.updateUser(user.id, { phoneVerified: true });
      }
      await repo.ensureCustomerProfile(user.id);
    }

    // Create session
    const { token } = await sessionService.createSession(user, {
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      repo,
    });

    await repo.recordAuditLog({
      userId: user.id,
      action: "AUTH_OTP_VERIFIED",
      details: { isNewUser },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return {
      ok: true,
      user,
      token,
      isNewUser,
    };
  }
}

export const otpService = new OtpService();
