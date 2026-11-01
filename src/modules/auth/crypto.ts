import crypto from "node:crypto";

/**
 * Generates a cryptographically random opaque token (default 32 bytes base64url).
 */
export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString("base64url");
}

/**
 * SHA-256 hash of a session token for safe persistence in PostgreSQL.
 * Raw session tokens are never stored in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates an HMAC-SHA256 hash using a server-side pepper/salt.
 * Used for storing privacy-preserving phone hashes and rate limit keys.
 */
export function hashWithPepper(data: string, pepper: string): string {
  return crypto.createHmac("sha256", pepper).update(data).digest("hex");
}

/**
 * Generates a 6-digit cryptographically secure numeric OTP string.
 */
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Computes HMAC-SHA256 hash of an OTP challenge code.
 */
export function hashOtp(otp: string, pepper: string): string {
  return crypto.createHmac("sha256", pepper).update(otp).digest("hex");
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates PKCE code_verifier and code_challenge (S256).
 */
export function generatePkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}
