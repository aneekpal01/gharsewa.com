"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestOtpAction, verifyOtpAction } from "@/modules/auth/actions";
import { Button, Icon } from "@/components/ui";

interface OtpLoginFormProps {
  returnUrl?: string;
}

export function OtpLoginForm({ returnUrl }: OtpLoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("phone", phone);
    if (returnUrl) formData.append("returnUrl", returnUrl);

    startTransition(async () => {
      const res = await requestOtpAction({ success: false }, formData);
      if (!res.success) {
        setError(res.error || "Failed to send verification code");
      } else {
        setStep("otp");
        setCooldownSeconds(res.data?.cooldownSeconds || 60);
        if (res.data?.devCode) {
          setDevCode(res.data.devCode);
        }
      }
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("otp", otp);
    if (returnUrl) formData.append("returnUrl", returnUrl);

    startTransition(async () => {
      const res = await verifyOtpAction({ success: false }, formData);
      if (!res.success) {
        setError(res.error || "Verification failed");
      } else {
        const destination = res.data?.redirectTo || returnUrl || "/services";
        router.push(destination);
        router.refresh();
      }
    });
  };

  const handleResend = () => {
    if (cooldownSeconds > 0 || isPending) return;
    setError(null);

    const formData = new FormData();
    formData.append("phone", phone);
    if (returnUrl) formData.append("returnUrl", returnUrl);

    startTransition(async () => {
      const res = await requestOtpAction({ success: false }, formData);
      if (!res.success) {
        setError(res.error || "Failed to resend code");
      } else {
        setCooldownSeconds(res.data?.cooldownSeconds || 60);
        if (res.data?.devCode) {
          setDevCode(res.data.devCode);
        }
      }
    });
  };

  const maskedPhone = phone.length >= 10
    ? `+91 ${phone.replace(/[^\d]/g, "").slice(-10).slice(0, 2)}****${phone.slice(-4)}`
    : phone;

  return (
    <div className="otp-login-card">
      {step === "phone" ? (
        <form onSubmit={handleRequestOtp} noValidate>
          <div className="field">
            <label htmlFor="customer-phone">Mobile Number</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span
                style={{
                  padding: "10px 14px",
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  fontWeight: 600,
                  color: "var(--ink)",
                  fontSize: "0.95rem",
                  userSelect: "none",
                }}
              >
                +91
              </span>
              <input
                id="customer-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isPending}
                style={{ flex: 1 }}
              />
            </div>
            <small style={{ color: "var(--muted)", marginTop: "4px", display: "block" }}>
              Enter your 10-digit mobile number. We will send a secure 6-digit code.
            </small>
          </div>

          {error ? (
            <div
              role="alert"
              style={{
                background: "#fdeae6",
                color: "var(--clay)",
                padding: "10px 14px",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "0.88rem",
              }}
            >
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isPending || phone.replace(/[^\d]/g, "").length < 10}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {isPending ? "Sending code..." : "Send verification code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} noValidate>
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--paper)",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--line)",
              }}
            >
              <span style={{ fontSize: "0.9rem", color: "var(--ink)", fontWeight: 500 }}>
                Code sent to <strong>{maskedPhone}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                }}
                disabled={isPending}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--forest)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Change
              </button>
            </div>
          </div>

          {devCode ? (
            <div
              style={{
                background: "#e8f4ec",
                border: "1px dashed var(--forest)",
                padding: "8px 12px",
                borderRadius: "6px",
                marginBottom: "14px",
                fontSize: "0.85rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                Dev Mock OTP: <strong>{devCode}</strong>
              </span>
              <button
                type="button"
                onClick={() => setOtp(devCode)}
                style={{
                  background: "var(--forest)",
                  color: "#fff",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Fill Code
              </button>
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="customer-otp">6-Digit Verification Code</label>
            <input
              id="customer-otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              required
              disabled={isPending}
              style={{
                fontSize: "1.4rem",
                letterSpacing: "0.3em",
                textAlign: "center",
                fontWeight: 600,
              }}
            />
          </div>

          {error ? (
            <div
              role="alert"
              style={{
                background: "#fdeae6",
                color: "var(--clay)",
                padding: "10px 14px",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "0.88rem",
              }}
            >
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isPending || otp.length !== 6}
            style={{ width: "100%", justifyContent: "center", marginBottom: "12px" }}
          >
            {isPending ? "Verifying..." : "Verify & Continue"}
          </Button>

          <div style={{ textAlign: "center", marginTop: "12px" }}>
            {cooldownSeconds > 0 ? (
              <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                Resend code in {cooldownSeconds}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isPending}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--forest)",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Resend code
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
