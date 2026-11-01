import "server-only";
import { generatePkce, generateSecureToken, timingSafeEqual } from "./crypto";
import { getAuthRepository, type IAuthRepository } from "./store";
import { sessionService } from "./session-service";
import type { GoogleAuthResult } from "./types";

export interface GoogleUserProfile {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export interface GoogleTokenExchangeResult {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
}

export type GoogleTokenExchanger = (
  code: string,
  codeVerifier: string,
  redirectUri: string
) => Promise<GoogleUserProfile>;

/**
 * Default production token exchanger communicating directly with Google OAuth 2.0 endpoints.
 */
export async function defaultGoogleTokenExchanger(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<GoogleUserProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials missing in environment");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: HTTP ${tokenRes.status}`);
  }

  const tokens = (await tokenRes.json()) as GoogleTokenExchangeResult;

  const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error(`Google userinfo fetch failed: HTTP ${userRes.status}`);
  }

  return (await userRes.json()) as GoogleUserProfile;
}

export class GoogleOAuthService {
  constructor(private tokenExchanger: GoogleTokenExchanger = defaultGoogleTokenExchanger) {}

  setTokenExchangerForTesting(exchanger: GoogleTokenExchanger): void {
    this.tokenExchanger = exchanger;
  }

  /**
   * Constructs the Google OAuth 2.0 authorization URL with state and PKCE challenge.
   */
  generateAuthUrl(returnUrl?: string): {
    url: string;
    state: string;
    codeVerifier: string;
    returnUrl?: string;
  } {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/callback/google";

    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID must be set in environment variables");
    }

    const state = generateSecureToken(32);
    const { codeVerifier, codeChallenge } = generatePkce();

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
      access_type: "online",
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return {
      url,
      state,
      codeVerifier,
      returnUrl,
    };
  }

  /**
   * Handles the OAuth callback, validates state and PKCE, exchanges code for user profile,
   * enforces the secure account linking policy, and establishes a server-side session.
   */
  async handleCallback(params: {
    code: string;
    state: string;
    expectedState: string;
    codeVerifier: string;
    currentUserId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    repo?: IAuthRepository;
  }): Promise<GoogleAuthResult> {
    // State validation to prevent CSRF
    if (
      !params.state ||
      !params.expectedState ||
      !timingSafeEqual(params.state, params.expectedState)
    ) {
      return { ok: false, error: "INVALID_STATE" };
    }

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/callback/google";
    const repo = params.repo ?? (await getAuthRepository());

    let googleProfile: GoogleUserProfile;
    try {
      googleProfile = await this.tokenExchanger(params.code, params.codeVerifier, redirectUri);
    } catch {
      return { ok: false, error: "INVALID_CODE" };
    }

    if (!googleProfile.sub || !googleProfile.email) {
      return { ok: false, error: "INVALID_CODE" };
    }

    // Check if this Google account is already linked to a GharSewa user
    const existingOAuth = await repo.findOAuthAccount("google", googleProfile.sub);

    let userId: string;
    let isNewUser = false;

    if (existingOAuth) {
      // If a user is currently logged in, verify they own this linked Google account
      if (params.currentUserId && existingOAuth.userId !== params.currentUserId) {
        return { ok: false, error: "ACCOUNT_LINK_CONFLICT" };
      }

      const existingUser = await repo.findUserById(existingOAuth.userId);
      if (!existingUser) {
        return { ok: false, error: "USER_DISABLED" };
      }
      if (!existingUser.isActive) {
        return { ok: false, error: "USER_DISABLED" };
      }

      userId = existingUser.id;
    } else {
      // Google account is not yet linked
      if (params.currentUserId) {
        // Link to currently authenticated session
        userId = params.currentUserId;
        await repo.createOAuthAccount({
          userId,
          provider: "google",
          providerUserId: googleProfile.sub,
          email: googleProfile.email,
          name: googleProfile.name,
          avatarUrl: googleProfile.picture,
        });
      } else {
        // Guest signing in via Google: Check if email already belongs to an unlinked user
        const existingEmailUser = await repo.findUserByEmail(googleProfile.email);
        if (existingEmailUser) {
          // Security Invariant: Never silently merge accounts by matching email string alone.
          // Requires user to log in via primary method first before linking.
          return { ok: false, error: "ACCOUNT_LINK_CONFLICT" };
        }

        // Create fresh Customer account
        const newUser = await repo.createUser({
          email: googleProfile.email.toLowerCase(),
          emailVerified: true,
          fullName: googleProfile.name,
          role: "CUSTOMER",
          isActive: true,
        });

        userId = newUser.id;
        isNewUser = true;

        await repo.ensureCustomerProfile(userId);
        await repo.createOAuthAccount({
          userId,
          provider: "google",
          providerUserId: googleProfile.sub,
          email: googleProfile.email,
          name: googleProfile.name,
          avatarUrl: googleProfile.picture,
        });
      }
    }

    const user = await repo.findUserById(userId);
    if (!user || !user.isActive) {
      return { ok: false, error: "USER_DISABLED" };
    }

    // Create session
    const { token } = await sessionService.createSession(user, {
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      repo,
    });

    await repo.recordAuditLog({
      userId: user.id,
      action: "AUTH_GOOGLE_SUCCESS",
      details: { isNewUser, googleSub: googleProfile.sub },
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

export const googleOAuthService = new GoogleOAuthService();
