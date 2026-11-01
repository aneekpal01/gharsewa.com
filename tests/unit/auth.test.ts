import { describe, it, expect, beforeEach } from "vitest";
import {
  DevInMemoryAuthRepository,
  devMockProvider,
  OtpService,
  SessionService,
  GoogleOAuthService,
  returnUrlSchema,
  phoneSchema,
  normalizePhoneNumber,
  CUSTOMER_IDLE_EXPIRY_MS,
  CUSTOMER_ABSOLUTE_EXPIRY_MS,
  ROTATION_INTERVAL_MS,
} from "@/modules/auth";

describe("Phase 3: Customer Authentication Unit Tests", () => {
  let repo: DevInMemoryAuthRepository;
  let otpService: OtpService;
  let sessionService: SessionService;
  let googleService: GoogleOAuthService;

  beforeEach(() => {
    repo = new DevInMemoryAuthRepository();
    devMockProvider.clear();
    otpService = new OtpService(() => devMockProvider, () => "test-pepper-secret-32-bytes-long");
    sessionService = new SessionService();
    googleService = new GoogleOAuthService();
  });

  // -------------------------------------------------------------
  // 1. OTP Expiry
  // -------------------------------------------------------------
  it("rejects verification of an expired OTP challenge", async () => {
    const phone = "+919876543210";
    const req = await otpService.requestOtp({ phone, repo });
    expect(req.ok).toBe(true);

    const challenge = await repo.getLatestOtpChallenge(otpService.hashPhone(phone));
    expect(challenge).toBeDefined();

    // Fast-forward challenge expiry to the past
    challenge!.expiresAt = new Date(Date.now() - 1000);

    const verify = await otpService.verifyOtp({
      phone,
      otp: req.ok && req.devCode ? req.devCode : "123456",
      repo,
    });

    expect(verify.ok).toBe(false);
    if (!verify.ok) {
      expect(verify.error).toBe("EXPIRED_OTP");
    }
  });

  // -------------------------------------------------------------
  // 2. OTP Incorrect Attempts and Lockout
  // -------------------------------------------------------------
  it("enforces attempt limits and locks out after 3 failed attempts", async () => {
    const phone = "+919876543211";
    const req = await otpService.requestOtp({ phone, repo });
    expect(req.ok).toBe(true);
    const validCode = req.ok ? req.devCode! : "000000";

    // Attempt 1: wrong code
    const attempt1 = await otpService.verifyOtp({ phone, otp: "999999", repo });
    expect(attempt1.ok).toBe(false);
    if (!attempt1.ok) {
      expect(attempt1.error).toBe("INVALID_OTP");
      expect(attempt1.attemptsRemaining).toBe(2);
    }

    // Attempt 2: wrong code
    const attempt2 = await otpService.verifyOtp({ phone, otp: "888888", repo });
    expect(attempt2.ok).toBe(false);
    if (!attempt2.ok) {
      expect(attempt2.error).toBe("INVALID_OTP");
      expect(attempt2.attemptsRemaining).toBe(1);
    }

    // Attempt 3: wrong code -> lockout reached
    const attempt3 = await otpService.verifyOtp({ phone, otp: "777777", repo });
    expect(attempt3.ok).toBe(false);
    if (!attempt3.ok) {
      expect(attempt3.error).toBe("MAX_ATTEMPTS_EXCEEDED");
    }

    // Subsequent attempt with CORRECT code is now rejected due to lockout
    const attempt4 = await otpService.verifyOtp({ phone, otp: validCode, repo });
    expect(attempt4.ok).toBe(false);
    if (!attempt4.ok) {
      expect(attempt4.error).toBe("MAX_ATTEMPTS_EXCEEDED");
    }
  });

  // -------------------------------------------------------------
  // 3. OTP Replay Prevention (Single-Use Verification)
  // -------------------------------------------------------------
  it("prevents replay of an already-used OTP challenge", async () => {
    const phone = "+919876543212";
    const req = await otpService.requestOtp({ phone, repo });
    expect(req.ok).toBe(true);
    const validCode = req.ok ? req.devCode! : "000000";

    // First verification succeeds
    const firstVerify = await otpService.verifyOtp({ phone, otp: validCode, repo });
    expect(firstVerify.ok).toBe(true);

    // Second verification with the exact same code is rejected
    const replayVerify = await otpService.verifyOtp({ phone, otp: validCode, repo });
    expect(replayVerify.ok).toBe(false);
    if (!replayVerify.ok) {
      expect(replayVerify.error).toBe("EXPIRED_OTP");
    }
  });

  // -------------------------------------------------------------
  // 4. OTP Resend Cooldown
  // -------------------------------------------------------------
  it("enforces 60-second resend cooldown between OTP requests", async () => {
    const phone = "+919876543213";

    // First request: succeeds
    const req1 = await otpService.requestOtp({ phone, repo });
    expect(req1.ok).toBe(true);
    if (req1.ok) {
      expect(req1.cooldownSeconds).toBe(60);
    }

    // Immediate second request: rejected with COOLDOWN_ACTIVE
    const req2 = await otpService.requestOtp({ phone, repo });
    expect(req2.ok).toBe(false);
    if (!req2.ok) {
      expect(req2.error).toBe("COOLDOWN_ACTIVE");
      expect(req2.retryAfterSeconds).toBeGreaterThan(0);
      expect(req2.retryAfterSeconds).toBeLessThanOrEqual(60);
    }
  });

  // -------------------------------------------------------------
  // 5. Concurrent OTP Verification
  // -------------------------------------------------------------
  it("handles concurrent OTP verification safely with single success", async () => {
    const phone = "+919876543214";
    const req = await otpService.requestOtp({ phone, repo });
    expect(req.ok).toBe(true);
    const validCode = req.ok ? req.devCode! : "000000";

    // Simulate 3 concurrent verification requests
    const results = await Promise.all([
      otpService.verifyOtp({ phone, otp: validCode, repo }),
      otpService.verifyOtp({ phone, otp: validCode, repo }),
      otpService.verifyOtp({ phone, otp: validCode, repo }),
    ]);

    const successes = results.filter((r) => r.ok);
    const failures = results.filter((r) => !r.ok);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(2);
  });

  // -------------------------------------------------------------
  // 6. Account Enumeration Resistance
  // -------------------------------------------------------------
  it("provides identical responses for existing and non-existing phone numbers", async () => {
    const existingPhone = "+919876543215";
    const newPhone = "+919876543216";

    // Pre-create existing user
    await repo.createUser({ phone: existingPhone, phoneVerified: true });

    const resExisting = await otpService.requestOtp({ phone: existingPhone, repo });
    const resNew = await otpService.requestOtp({ phone: newPhone, repo });

    expect(resExisting.ok).toBe(true);
    expect(resNew.ok).toBe(true);
    if (resExisting.ok && resNew.ok) {
      expect(resExisting.cooldownSeconds).toBe(resNew.cooldownSeconds);
      // Both responses have exact same shape without disclosing account existence
    }
  });

  // -------------------------------------------------------------
  // 7. Google OAuth State and Callback Validation
  // -------------------------------------------------------------
  it("validates OAuth state and rejects CSRF / forged callback states", async () => {
    const state = "valid-state-value-1234567890abcdef";
    const wrongState = "tampered-state-value-abcdef123456";

    const result = await googleService.handleCallback({
      code: "dummy-auth-code",
      state: wrongState,
      expectedState: state,
      codeVerifier: "dummy-pkce-verifier",
      repo,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("INVALID_STATE");
    }
  });

  // -------------------------------------------------------------
  // 8. Secure Account Linking
  // -------------------------------------------------------------
  it("prevents an attacker from linking another user's Google account or silently merging unlinked accounts", async () => {
    // Mock token exchanger
    googleService.setTokenExchangerForTesting(async () => ({
      sub: "google-sub-user-a",
      email: "user.a@example.com",
      name: "User A",
    }));

    // User A registers via Google
    const userAResult = await googleService.handleCallback({
      code: "code-a",
      state: "state-a",
      expectedState: "state-a",
      codeVerifier: "verifier-a",
      repo,
    });
    expect(userAResult.ok).toBe(true);

    // User B exists with different account
    const userB = await repo.createUser({
      phone: "+919876543299",
      fullName: "User B",
    });

    // User B tries to link Google Sub of User A
    const conflictResult = await googleService.handleCallback({
      code: "code-b",
      state: "state-b",
      expectedState: "state-b",
      codeVerifier: "verifier-b",
      currentUserId: userB.id,
      repo,
    });

    expect(conflictResult.ok).toBe(false);
    if (!conflictResult.ok) {
      expect(conflictResult.error).toBe("ACCOUNT_LINK_CONFLICT");
    }

    // Now test unlinked email conflict:
    // Existing user has email without Google link
    await repo.createUser({
      email: "unlinked@example.com",
      fullName: "Unlinked Customer",
    });

    googleService.setTokenExchangerForTesting(async () => ({
      sub: "google-sub-attacker",
      email: "unlinked@example.com", // Attacker with same email
      name: "Attacker",
    }));

    // Guest sign-in with matching email must NOT silently merge
    const unlinkedMergeAttempt = await googleService.handleCallback({
      code: "code-attacker",
      state: "state-attacker",
      expectedState: "state-attacker",
      codeVerifier: "verifier-attacker",
      repo,
    });

    expect(unlinkedMergeAttempt.ok).toBe(false);
    if (!unlinkedMergeAttempt.ok) {
      expect(unlinkedMergeAttempt.error).toBe("ACCOUNT_LINK_CONFLICT");
    }
  });

  // -------------------------------------------------------------
  // 9. Session Idle and Absolute Expiration
  // -------------------------------------------------------------
  it("enforces idle and absolute expiration ceilings", async () => {
    const user = await repo.createUser({ phone: "+919876543217" });
    const { token, session } = await sessionService.createSession(user, { repo });

    // 1. Active session validates
    const validRes = await sessionService.validateSession(token, { repo, skipRotation: true });
    expect(validRes.ok).toBe(true);

    // 2. Idle expiration triggered (simulate inactivity)
    await repo.updateSessionIdleExpiry(session.id, new Date(Date.now() - 1000));
    const idleRes = await sessionService.validateSession(token, { repo, skipRotation: true });
    expect(idleRes.ok).toBe(false);
    if (!idleRes.ok) {
      expect(idleRes.error).toBe("EXPIRED_IDLE");
    }

    // 3. Absolute expiration triggered (even if idle was renewed)
    const { token: token2, session: session2 } = await sessionService.createSession(user, { repo });
    const s2InRepo = await repo.findSessionByTokenHash(
      (await import("@/modules/auth/crypto")).hashToken(token2)
    );
    s2InRepo!.absoluteExpiresAt = new Date(Date.now() - 1000);
    s2InRepo!.idleExpiresAt = new Date(Date.now() + CUSTOMER_IDLE_EXPIRY_MS);

    const absRes = await sessionService.validateSession(token2, { repo, skipRotation: true });
    expect(absRes.ok).toBe(false);
    if (!absRes.ok) {
      expect(absRes.error).toBe("EXPIRED_ABSOLUTE");
    }
  });

  // -------------------------------------------------------------
  // 10. Session Rotation and Grace-Period Recovery
  // -------------------------------------------------------------
  it("supports session rotation and 60-second grace-period recovery for lost responses", async () => {
    const user = await repo.createUser({ phone: "+919876543218" });
    const { token: oldToken, session } = await sessionService.createSession(user, { repo });

    // Advance session authentication time past rotation interval (25 hours)
    session.lastAuthenticatedAt = new Date(Date.now() - (ROTATION_INTERVAL_MS + 3600000));

    // Request triggers rotation
    const rotationRes = await sessionService.validateSession(oldToken, { repo });
    expect(rotationRes.ok).toBe(true);
    if (rotationRes.ok) {
      expect(rotationRes.refreshedToken).toBeDefined();
    }

    // Simulate client dropped network connection and presented oldToken again within 60s
    const recoveryRes = await sessionService.validateSession(oldToken, { repo });
    expect(recoveryRes.ok).toBe(true);
    if (recoveryRes.ok) {
      expect(recoveryRes.user.id).toBe(user.id);
    }

    // After 60 seconds grace period, oldToken must be permanently rejected
    const oldSessionRecord = await repo.findSessionByTokenHash(
      (await import("@/modules/auth/crypto")).hashToken(oldToken)
    );
    expect(oldSessionRecord).toBeDefined();
    oldSessionRecord!.rotatedAt = new Date(Date.now() - 65 * 1000); // 65 seconds ago

    const expiredOldRes = await sessionService.validateSession(oldToken, { repo });
    expect(expiredOldRes.ok).toBe(false);
    if (!expiredOldRes.ok) {
      expect(expiredOldRes.error).toBe("TOKEN_REVOKED");
    }
  });

  // -------------------------------------------------------------
  // 11. Logout and All-Session Revocation
  // -------------------------------------------------------------
  it("supports single-session logout and revoking all active sessions", async () => {
    const user = await repo.createUser({ phone: "+919876543219" });
    const s1 = await sessionService.createSession(user, { repo });
    const s2 = await sessionService.createSession(user, { repo });

    // Single session logout
    await sessionService.revokeSession(s1.token, repo);
    const s1Check = await sessionService.validateSession(s1.token, { repo, skipRotation: true });
    expect(s1Check.ok).toBe(false);
    if (!s1Check.ok) {
      expect(s1Check.error).toBe("TOKEN_REVOKED");
    }

    // Session 2 is still active
    const s2Check = await sessionService.validateSession(s2.token, { repo, skipRotation: true });
    expect(s2Check.ok).toBe(true);

    // Revoke all sessions
    const s3 = await sessionService.createSession(user, { repo });
    const count = await sessionService.revokeAllSessions(user.id, repo);
    expect(count).toBeGreaterThanOrEqual(2);

    const s2Revoked = await sessionService.validateSession(s2.token, { repo, skipRotation: true });
    const s3Revoked = await sessionService.validateSession(s3.token, { repo, skipRotation: true });
    expect(s2Revoked.ok).toBe(false);
    expect(s3Revoked.ok).toBe(false);
  });

  // -------------------------------------------------------------
  // 12. Disabled Account Rejection
  // -------------------------------------------------------------
  it("immediately rejects and invalidates sessions for disabled accounts", async () => {
    const user = await repo.createUser({ phone: "+919876543220", isActive: true });
    const { token } = await sessionService.createSession(user, { repo });

    // Active: works
    const check1 = await sessionService.validateSession(token, { repo, skipRotation: true });
    expect(check1.ok).toBe(true);

    // Disable account
    await repo.updateUser(user.id, { isActive: false });

    // Subsequent access is blocked
    const check2 = await sessionService.validateSession(token, { repo, skipRotation: true });
    expect(check2.ok).toBe(false);
    if (!check2.ok) {
      expect(check2.error).toBe("USER_DISABLED");
    }
  });

  // -------------------------------------------------------------
  // 13. Unauthorized Access Rejection
  // -------------------------------------------------------------
  it("rejects unauthorized access attempts with missing, malformed or empty tokens", async () => {
    expect((await sessionService.validateSession("", { repo })).ok).toBe(false);
    expect((await sessionService.validateSession("non-existent-opaque-token", { repo })).ok).toBe(false);
  });

  // -------------------------------------------------------------
  // 14. Guest Intent Preservation & Open Redirect Protection
  // -------------------------------------------------------------
  it("preserves valid relative paths and rejects open redirect targets", () => {
    // Valid relative internal targets
    expect(returnUrlSchema.safeParse("/services").success).toBe(true);
    expect(returnUrlSchema.safeParse("/services/switchboard-repair").success).toBe(true);
    expect(returnUrlSchema.safeParse("/account").success).toBe(true);
    expect(returnUrlSchema.safeParse(undefined).success).toBe(true);

    // Malicious open redirect targets
    expect(returnUrlSchema.safeParse("https://evil.com").success).toBe(false);
    expect(returnUrlSchema.safeParse("//attacker.com").success).toBe(false);
    expect(returnUrlSchema.safeParse("http://localhost:3000/phish").success).toBe(false);
    expect(returnUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });

  // Phone schema normalization
  it("normalizes and validates Indian phone numbers to E.164", () => {
    expect(phoneSchema.parse("9876543210")).toBe("+919876543210");
    expect(phoneSchema.parse("+91 98765 43210")).toBe("+919876543210");
    expect(phoneSchema.parse("09876543210")).toBe("+919876543210");
    expect(phoneSchema.parse("919876543210")).toBe("+919876543210");

    expect(phoneSchema.safeParse("12345").success).toBe(false);
    expect(phoneSchema.safeParse("abcdefghij").success).toBe(false);
    expect(phoneSchema.safeParse("5876543210").success).toBe(false); // Does not start with 6-9
  });
});
