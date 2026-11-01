"use server";

import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  getSessionTokenFromCookies,
  setIntentCookie,
  setSessionCookie,
} from "./cookies";
import { getClientSecurityContext } from "./guards";
import { otpService } from "./otp-service";
import { requestOtpSchema, verifyOtpSchema } from "./schemas";
import { sessionService } from "./session-service";

export interface ActionState<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function requestOtpAction(
  _prevState: ActionState<{ cooldownSeconds: number; devCode?: string }>,
  formData: FormData
): Promise<ActionState<{ cooldownSeconds: number; devCode?: string }>> {
  const rawPhone = formData.get("phone") as string;
  const returnUrl = (formData.get("returnUrl") as string) || undefined;

  const parsed = requestOtpSchema.safeParse({ phone: rawPhone, returnUrl });
  if (!parsed.success) {
    return {
      success: false,
      error: "Please enter a valid 10-digit Indian mobile number",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { ipAddress } = await getClientSecurityContext();

  if (parsed.data.returnUrl) {
    await setIntentCookie(parsed.data.returnUrl);
  }

  const result = await otpService.requestOtp({
    phone: parsed.data.phone,
    ipAddress,
  });

  if (!result.ok) {
    if (result.error === "RATE_LIMITED") {
      return {
        success: false,
        error: `Too many requests. Please wait ${Math.ceil((result.retryAfterSeconds || 60) / 60)} minutes before trying again.`,
      };
    }
    if (result.error === "COOLDOWN_ACTIVE") {
      return {
        success: false,
        error: `Please wait ${result.retryAfterSeconds} seconds before requesting a new code.`,
      };
    }
    if (result.error === "DATABASE_UNAVAILABLE") {
      return {
        success: false,
        error: "Authentication service is temporarily unavailable. Please try again.",
      };
    }
    return {
      success: false,
      error: "Could not send verification code. Please check your number.",
    };
  }

  return {
    success: true,
    data: {
      cooldownSeconds: result.cooldownSeconds,
      devCode: result.devCode,
    },
  };
}

export async function verifyOtpAction(
  _prevState: ActionState<{ redirectTo: string }>,
  formData: FormData
): Promise<ActionState<{ redirectTo: string }>> {
  const rawPhone = formData.get("phone") as string;
  const otp = formData.get("otp") as string;
  const returnUrl = (formData.get("returnUrl") as string) || undefined;

  const parsed = verifyOtpSchema.safeParse({ phone: rawPhone, otp, returnUrl });
  if (!parsed.success) {
    return {
      success: false,
      error: "Please enter a valid 6-digit verification code",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { ipAddress, userAgent } = await getClientSecurityContext();

  const result = await otpService.verifyOtp({
    phone: parsed.data.phone,
    otp: parsed.data.otp,
    ipAddress,
    userAgent,
  });

  if (!result.ok) {
    if (result.error === "MAX_ATTEMPTS_EXCEEDED") {
      return {
        success: false,
        error: "Maximum verification attempts exceeded. Please request a new code.",
      };
    }
    if (result.error === "INVALID_OTP") {
      const remaining = result.attemptsRemaining ?? 0;
      return {
        success: false,
        error: `Invalid code. ${remaining} ${remaining === 1 ? "attempt" : "attempts"} remaining.`,
      };
    }
    if (result.error === "EXPIRED_OTP") {
      return {
        success: false,
        error: "Verification code has expired. Please request a new one.",
      };
    }
    if (result.error === "USER_DISABLED") {
      return {
        success: false,
        error: "This account has been disabled. Please contact GharSewa support.",
      };
    }
    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  }

  // Set session cookie
  await setSessionCookie(result.token);

  // Preserve guest intent URL (fallback to /services or /)
  const targetUrl = parsed.data.returnUrl || "/services";
  return {
    success: true,
    data: {
      redirectTo: targetUrl,
    },
  };
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionTokenFromCookies();
  if (token) {
    await sessionService.revokeSession(token);
  }
  await clearSessionCookie();
  redirect("/");
}

export async function logoutAllAction(): Promise<void> {
  const token = await getSessionTokenFromCookies();
  if (token) {
    const validation = await sessionService.validateSession(token, { skipRotation: true });
    if (validation.ok) {
      await sessionService.revokeAllSessions(validation.user.id);
    }
  }
  await clearSessionCookie();
  redirect("/");
}
