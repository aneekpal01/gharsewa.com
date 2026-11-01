import type { UserRole as PrismaUserRole } from "@prisma/client";

export type UserRole = PrismaUserRole;

export interface AuthenticatedUser {
  id: string;
  phone: string | null;
  phoneVerified: boolean;
  email: string | null;
  emailVerified: boolean;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  lastAuthenticatedAt: Date;
  rotatedAt: Date | null;
  replacedByHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface OtpChallengeRecord {
  id: string;
  phoneHash: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  usedAt: Date | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface RateLimitEventRecord {
  id: string;
  keyHash: string;
  windowStart: Date;
  createdAt: Date;
}

export interface OAuthAccountRecord {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  linkedAt: Date;
}

export type SessionValidationResult =
  | {
      ok: true;
      session: SessionRecord;
      user: AuthenticatedUser;
      refreshedToken?: string;
    }
  | {
      ok: false;
      error:
        | "UNAUTHENTICATED"
        | "EXPIRED_IDLE"
        | "EXPIRED_ABSOLUTE"
        | "USER_DISABLED"
        | "TOKEN_REVOKED";
    };

export type OtpRequestResult =
  | {
      ok: true;
      cooldownSeconds: number;
      devCode?: string;
    }
  | {
      ok: false;
      error:
        | "RATE_LIMITED"
        | "COOLDOWN_ACTIVE"
        | "DATABASE_UNAVAILABLE"
        | "INVALID_PHONE";
      retryAfterSeconds?: number;
    };

export type OtpVerifyResult =
  | {
      ok: true;
      user: AuthenticatedUser;
      token: string;
      isNewUser: boolean;
    }
  | {
      ok: false;
      error:
        | "INVALID_OTP"
        | "EXPIRED_OTP"
        | "MAX_ATTEMPTS_EXCEEDED"
        | "RATE_LIMITED"
        | "USER_DISABLED"
        | "DATABASE_UNAVAILABLE";
      attemptsRemaining?: number;
    };

export type GoogleAuthResult =
  | {
      ok: true;
      user: AuthenticatedUser;
      token: string;
      isNewUser: boolean;
    }
  | {
      ok: false;
      error:
        | "INVALID_STATE"
        | "INVALID_CODE"
        | "ACCOUNT_LINK_CONFLICT"
        | "USER_DISABLED"
        | "DATABASE_UNAVAILABLE"
        | "CONFIG_ERROR";
    };
