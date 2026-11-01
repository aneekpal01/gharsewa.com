import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OtpLoginForm } from "@/components/auth/OtpLoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Icon } from "@/components/ui";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{
    returnUrl?: string;
    error?: string;
  }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  google_config:
    "Google sign-in is not yet configured for this environment. Please use Mobile OTP login.",
  oauth_denied: "Google sign-in was cancelled or denied.",
  state_expired: "Your sign-in session expired. Please try signing in again.",
  link_conflict:
    "This Google account is already linked to a different GharSewa account, or an account with this email already exists.",
  user_disabled: "This account has been suspended. Please contact GharSewa support.",
  auth_failed: "Authentication failed. Please try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnUrl = params.returnUrl;
  const errorKey = params.error;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] || "Authentication error occurred" : null;

  return (
    <>
      <SiteHeader currentPath="/auth/login" />

      <main className="auth-page-container" style={{ padding: "48px 16px 80px", minHeight: "75vh" }}>
        <div style={{ maxWidth: "460px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <span className="eyebrow" style={{ display: "inline-block", marginBottom: "6px" }}>
              Customer Portal
            </span>
            <h1 style={{ fontSize: "1.85rem", color: "var(--forest)", marginBottom: "8px" }}>
              Welcome to GharSewa
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              Fast, passwordless access for Gangtok households. Sign in with your mobile number or Google account.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage ? (
            <div
              role="alert"
              style={{
                background: "#fdeae6",
                border: "1px solid #f8c2b8",
                color: "var(--clay)",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "24px",
                fontSize: "0.9rem",
                lineHeight: 1.5,
              }}
            >
              <strong>Notice:</strong> {errorMessage}
            </div>
          ) : null}

          {/* Main Auth Card */}
          <div
            className="surface"
            style={{
              padding: "28px",
              borderRadius: "12px",
              border: "1px solid var(--line)",
              background: "#ffffff",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", marginBottom: "16px", color: "var(--ink)" }}>
              Mobile Phone Verification
            </h2>

            <OtpLoginForm returnUrl={returnUrl} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "24px 0",
                color: "var(--muted)",
                fontSize: "0.85rem",
              }}
            >
              <hr style={{ flex: 1, border: 0, borderTop: "1px solid var(--line)" }} />
              <span style={{ padding: "0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Or
              </span>
              <hr style={{ flex: 1, border: 0, borderTop: "1px solid var(--line)" }} />
            </div>

            <GoogleSignInButton returnUrl={returnUrl} />
          </div>

          {/* Privacy & Trust Assurances */}
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              background: "var(--paper)",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              fontSize: "0.82rem",
              color: "var(--ink)",
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ color: "var(--forest)", display: "flex" }}>
                <Icon name="shield" />
              </span>
              <strong>Household Privacy & Protection</strong>
            </div>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              We never sell your contact information. Your phone number is strictly used for one-time
              verification and verified technician dispatch across Gangtok.
            </p>
          </div>

          {/* Return link */}
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Link
              href={returnUrl || "/services"}
              style={{
                fontSize: "0.88rem",
                color: "var(--forest)",
                textDecoration: "underline",
                fontWeight: 500,
              }}
            >
              ← Back to Service Catalog
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
