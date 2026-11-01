import "server-only";
import { headers } from "next/headers";
import {
  clearSessionCookie,
  getSessionTokenFromCookies,
  setSessionCookie,
} from "./cookies";
import { sessionService } from "./session-service";
import type { AuthenticatedUser, SessionRecord } from "./types";

export interface CurrentAuthContext {
  user: AuthenticatedUser;
  session: SessionRecord;
}

/**
 * Resolves the currently authenticated user from server-side session cookies.
 * Handles automatic token rotation response refresh and invalid cookie cleanup.
 */
export async function getCurrentSession(): Promise<CurrentAuthContext | null> {
  const token = await getSessionTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    const result = await sessionService.validateSession(token);
    if (!result.ok) {
      console.warn(`[GharSewa Auth] validateSession failed: ${result.error}`);
      await clearSessionCookie();
      return null;
    }

    if (result.refreshedToken) {
      await setSessionCookie(result.refreshedToken);
    }

    return {
      user: result.user,
      session: result.session,
    };
  } catch (err) {
    console.error("[GharSewa Auth] getCurrentSession error:", err);
    return null;
  }
}

/**
 * Helper to extract client IP address and User Agent for security auditing.
 */
export async function getClientSecurityContext(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : headerList.get("x-real-ip");
  const userAgent = headerList.get("user-agent");

  return {
    ipAddress,
    userAgent,
  };
}
