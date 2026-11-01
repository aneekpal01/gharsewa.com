import { NextRequest, NextResponse } from "next/server";
import {
  getAndClearOAuthStateCookie,
  setSessionCookie,
} from "@/modules/auth/cookies";
import { getCurrentSession, getClientSecurityContext } from "@/modules/auth/guards";
import { googleOAuthService } from "@/modules/auth/google-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const loginBase = new URL("/auth/login", request.nextUrl.origin);

  if (errorParam || !code || !state) {
    loginBase.searchParams.set("error", "oauth_denied");
    return NextResponse.redirect(loginBase);
  }

  const savedState = await getAndClearOAuthStateCookie();
  if (!savedState) {
    loginBase.searchParams.set("error", "state_expired");
    return NextResponse.redirect(loginBase);
  }

  const currentAuth = await getCurrentSession();
  const { ipAddress, userAgent } = await getClientSecurityContext();

  const result = await googleOAuthService.handleCallback({
    code,
    state,
    expectedState: savedState.state,
    codeVerifier: savedState.codeVerifier,
    currentUserId: currentAuth?.user.id,
    ipAddress,
    userAgent,
  });

  if (!result.ok) {
    if (result.error === "ACCOUNT_LINK_CONFLICT") {
      loginBase.searchParams.set("error", "link_conflict");
    } else if (result.error === "USER_DISABLED") {
      loginBase.searchParams.set("error", "user_disabled");
    } else {
      loginBase.searchParams.set("error", "auth_failed");
    }
    return NextResponse.redirect(loginBase);
  }

  await setSessionCookie(result.token);

  const destination = savedState.returnUrl || "/services";
  const redirectUrl = new URL(destination, request.nextUrl.origin);
  return NextResponse.redirect(redirectUrl);
}
