import "server-only";
import { generateSecureToken, hashToken } from "./crypto";
import { getAuthRepository, type IAuthRepository } from "./store";
import type { AuthenticatedUser, SessionRecord, SessionValidationResult } from "./types";

// Dual-expiration windows for CUSTOMER sessions
export const CUSTOMER_IDLE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const CUSTOMER_ABSOLUTE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const ROTATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours between proactive rotations
export const ROTATION_GRACE_PERIOD_SECONDS = 60; // 60s grace period for dropped rotation responses

export class SessionService {
  /**
   * Creates a new server-side session for an authenticated user.
   * Returns the raw opaque token (for the cookie) and the persisted session record.
   */
  async createSession(
    user: AuthenticatedUser,
    options?: {
      ipAddress?: string | null;
      userAgent?: string | null;
      repo?: IAuthRepository;
    }
  ): Promise<{ token: string; session: SessionRecord }> {
    const repo = options?.repo ?? (await getAuthRepository());
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);

    const now = new Date();
    const idleExpiresAt = new Date(now.getTime() + CUSTOMER_IDLE_EXPIRY_MS);
    const absoluteExpiresAt = new Date(now.getTime() + CUSTOMER_ABSOLUTE_EXPIRY_MS);

    const session = await repo.createSession({
      userId: user.id,
      tokenHash,
      idleExpiresAt,
      absoluteExpiresAt,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    await repo.recordAuditLog({
      userId: user.id,
      action: "AUTH_SESSION_CREATED",
      details: { sessionId: session.id },
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    return { token: rawToken, session };
  }

  /**
   * Validates a session token. Implements:
   * 1. SHA-256 hash lookup.
   * 2. Active account verification.
   * 3. Dual-expiration checks (absolute & idle).
   * 4. 60-second grace-period recovery for lost rotation responses.
   * 5. Safe token rotation with 60-second transition window.
   */
  async validateSession(
    rawToken: string,
    options?: {
      repo?: IAuthRepository;
      skipRotation?: boolean;
    }
  ): Promise<SessionValidationResult> {
    if (!rawToken || typeof rawToken !== "string") {
      return { ok: false, error: "UNAUTHENTICATED" };
    }

    const repo = options?.repo ?? (await getAuthRepository());
    const tokenHash = hashToken(rawToken);

    // Primary lookup
    let session = await repo.findSessionByTokenHash(tokenHash);
    let recoveredFromRotation = false;

    // Grace-period recovery lookup if direct session not found or was rotated
    if (!session || (session.rotatedAt && session.replacedByHash)) {
      const recovered = await repo.findRotatedSession(tokenHash, ROTATION_GRACE_PERIOD_SECONDS);
      if (recovered) {
        session = recovered;
        recoveredFromRotation = true;
      }
    }

    if (!session) {
      return { ok: false, error: "UNAUTHENTICATED" };
    }

    // A rotated token outside the 60-second recovery window is permanently revoked
    if (session.rotatedAt && !recoveredFromRotation) {
      return { ok: false, error: "TOKEN_REVOKED" };
    }

    // Check if revoked
    if (session.revokedAt) {
      return { ok: false, error: "TOKEN_REVOKED" };
    }

    // Check user existence and active status
    const user = await repo.findUserById(session.userId);
    if (!user || !user.isActive) {
      // Disabled account: revoke this session
      await repo.revokeSession(session.tokenHash);
      return { ok: false, error: "USER_DISABLED" };
    }

    const now = new Date();

    // Absolute expiration: hard ceiling, no renewal
    if (now > session.absoluteExpiresAt) {
      await repo.revokeSession(session.tokenHash);
      return { ok: false, error: "EXPIRED_ABSOLUTE" };
    }

    // Idle expiration: sliding window inactivity
    if (now > session.idleExpiresAt) {
      await repo.revokeSession(session.tokenHash);
      return { ok: false, error: "EXPIRED_IDLE" };
    }

    // If we recovered from an old token within the 60s grace period,
    // we don't rotate again; we return the recovered session so the caller can refresh the cookie if needed.
    if (recoveredFromRotation) {
      return {
        ok: true,
        session,
        user,
      };
    }

    // Check if session qualifies for proactive rotation (e.g. after 24 hours of use)
    const timeSinceAuth = now.getTime() - session.lastAuthenticatedAt.getTime();
    if (!options?.skipRotation && timeSinceAuth > ROTATION_INTERVAL_MS) {
      const newRawToken = generateSecureToken(32);
      const newTokenHash = hashToken(newRawToken);
      const newIdleExpiresAt = new Date(now.getTime() + CUSTOMER_IDLE_EXPIRY_MS);

      const rotated = await repo.rotateSession(session.tokenHash, {
        userId: user.id,
        tokenHash: newTokenHash,
        idleExpiresAt: newIdleExpiresAt,
        absoluteExpiresAt: session.absoluteExpiresAt, // Invariant: inherit absolute ceiling
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      });

      return {
        ok: true,
        session: rotated.newSession,
        user,
        refreshedToken: newRawToken,
      };
    }

    // Slide idle expiration forward
    const refreshedIdle = new Date(now.getTime() + CUSTOMER_IDLE_EXPIRY_MS);
    await repo.updateSessionIdleExpiry(session.id, refreshedIdle);
    session.idleExpiresAt = refreshedIdle;

    return {
      ok: true,
      session,
      user,
    };
  }

  /**
   * Revokes the current session.
   */
  async revokeSession(rawToken: string, repo?: IAuthRepository): Promise<void> {
    if (!rawToken) return;
    const r = repo ?? (await getAuthRepository());
    const tokenHash = hashToken(rawToken);
    await r.revokeSession(tokenHash);
  }

  /**
   * Revokes all active sessions for a given user.
   */
  async revokeAllSessions(userId: string, repo?: IAuthRepository): Promise<number> {
    const r = repo ?? (await getAuthRepository());
    return r.revokeAllUserSessions(userId);
  }
}

export const sessionService = new SessionService();
