import { z } from "zod";

export function normalizePhoneNumber(raw: string): string {
  if (!raw) return "";
  // Strip all non-digit and non-plus characters
  let cleaned = raw.replace(/[^\d+]/g, "");

  // If starts with 0 and followed by 10 digits, remove leading 0
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // If 10 digits starting with 6-9, prepend +91
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // If 12 digits starting with 91 followed by 6-9
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // If starts with +91 followed by 10 digits
  if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  return cleaned;
}

export const phoneSchema = z
  .string()
  .min(10, "Phone number must have at least 10 digits")
  .max(16, "Phone number is too long")
  .transform((val) => normalizePhoneNumber(val))
  .refine((val) => /^\+91[6-9]\d{9}$/.test(val), {
    message: "Please enter a valid 10-digit Indian mobile number (e.g. 98765 43210)",
  });

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Verification code must be exactly 6 digits");

export const returnUrlSchema = z
  .string()
  .optional()
  .refine(
    (url) => {
      if (!url) return true;
      // Must be a relative path, not protocol-relative or external URL to prevent open redirect
      return url.startsWith("/") && !url.startsWith("//") && !url.includes("://");
    },
    { message: "Invalid redirect target" }
  );

export const requestOtpSchema = z.object({
  phone: phoneSchema,
  returnUrl: returnUrlSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpCodeSchema,
  returnUrl: returnUrlSchema,
});

export const googleCallbackSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().min(1, "State is required"),
});
