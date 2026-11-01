import { NextRequest, NextResponse } from "next/server";
import { setOAuthStateCookie } from "@/modules/auth/cookies";
import { googleOAuthService } from "@/modules/auth/google-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnUrl = searchParams.get("returnUrl") || undefined;

  try {
    const authData = googleOAuthService.generateAuthUrl(returnUrl);
    await setOAuthStateCookie({
      state: authData.state,
      codeVerifier: authData.codeVerifier,
      returnUrl: authData.returnUrl,
    });

    return NextResponse.redirect(authData.url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google OAuth initialization failed";
    console.warn(`[GharSewa Google Auth] ${message}`);
    const loginUrl = new URL("/auth/login", request.nextUrl.origin);
    loginUrl.searchParams.set("error", "google_config");
    if (returnUrl) {
      loginUrl.searchParams.set("returnUrl", returnUrl);
    }
    return NextResponse.redirect(loginUrl);
  }
}
