import Link from "next/link";

interface GoogleSignInButtonProps {
  returnUrl?: string;
  className?: string;
}

export function GoogleSignInButton({ returnUrl, className = "" }: GoogleSignInButtonProps) {
  const href = returnUrl
    ? `/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`
    : "/auth/google";

  return (
    <Link
      href={href}
      className={`google-sign-in-button ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
        padding: "10px 16px",
        borderRadius: "6px",
        border: "1px solid var(--line)",
        background: "#ffffff",
        color: "var(--ink)",
        fontWeight: 600,
        fontSize: "0.95rem",
        textDecoration: "none",
        transition: "background 0.15s ease, border-color 0.15s ease",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.27-2.09 3.675-5.17 3.675-9.15z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.25 21.31 7.31 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.24A7.2 7.2 0 0 1 4.89 12c0-.78.14-1.53.38-2.24V6.61H1.27A11.97 11.97 0 0 0 0 12c0 1.92.45 3.74 1.27 5.39l4-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
        />
      </svg>
      <span>Continue with Google</span>
    </Link>
  );
}
