import "server-only";
import { cookies } from "next/headers";

const IS_PROD = process.env.NODE_ENV === "production";

export const SESSION_COOKIE_NAME = IS_PROD
  ? "__Host-gharsewa_session"
  : "gharsewa_session";

export const OAUTH_STATE_COOKIE_NAME = IS_PROD
  ? "__Host-gharsewa_oauth_state"
  : "gharsewa_oauth_state";

export const INTENT_COOKIE_NAME = "gharsewa_auth_intent";

// 30 days absolute max age
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  return cookie?.value ?? null;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: SESSION_COOKIE_NAME,
    path: "/",
    secure: IS_PROD,
  });
}

export async function setOAuthStateCookie(stateData: {
  state: string;
  codeVerifier: string;
  returnUrl?: string;
}): Promise<void> {
  const cookieStore = await cookies();
  const value = Buffer.from(JSON.stringify(stateData)).toString("base64url");
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, value, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });
}

export async function getAndClearOAuthStateCookie(): Promise<{
  state: string;
  codeVerifier: string;
  returnUrl?: string;
} | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(OAUTH_STATE_COOKIE_NAME);
  if (!cookie?.value) return null;

  cookieStore.delete({
    name: OAUTH_STATE_COOKIE_NAME,
    path: "/",
    secure: IS_PROD,
  });

  try {
    const raw = Buffer.from(cookie.value, "base64url").toString("utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setIntentCookie(returnUrl: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(INTENT_COOKIE_NAME, returnUrl, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60, // 30 minutes
  });
}

export async function getAndClearIntentCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(INTENT_COOKIE_NAME);
  if (!cookie?.value) return null;

  cookieStore.delete({
    name: INTENT_COOKIE_NAME,
    path: "/",
    secure: IS_PROD,
  });

  return cookie.value;
}
