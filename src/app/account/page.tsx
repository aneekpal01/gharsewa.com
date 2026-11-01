import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentSession } from "@/modules/auth/guards";
import { customerService } from "@/modules/customers/customer-service";
import { logoutAction, logoutAllAction } from "@/modules/auth/actions";
import { Button, Icon, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const auth = await getCurrentSession();
  if (!auth) {
    redirect("/auth/login?returnUrl=/account");
  }

  const customerData = await customerService.getCustomerDetails(auth.user.id);

  return (
    <>
      <SiteHeader currentPath="/account" />

      <main style={{ padding: "48px 16px 80px", minHeight: "75vh" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ marginBottom: "28px" }}>
            <span className="eyebrow">Customer Account</span>
            <h1 style={{ fontSize: "1.85rem", color: "var(--forest)", marginBottom: "6px" }}>
              Profile &amp; Security
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
              Manage your verified household contact details and active sessions.
            </p>
          </div>

          <div
            className="surface"
            style={{
              padding: "24px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1px solid var(--line)",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ fontSize: "1.2rem", marginBottom: "16px", color: "var(--ink)" }}>
              Contact Information
            </h2>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                  Mobile Number
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--ink)" }}>
                    {auth.user.phone || "Not linked"}
                  </span>
                  {auth.user.phoneVerified ? (
                    <StatusBadge tone="success">Verified</StatusBadge>
                  ) : null}
                </div>
              </div>

              {auth.user.email ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                    Email Address
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--ink)" }}>
                      {auth.user.email}
                    </span>
                    {auth.user.emailVerified ? (
                      <StatusBadge tone="success">Verified</StatusBadge>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                  Google Account
                </label>
                <div>
                  {customerData?.linkedGoogle ? (
                    <StatusBadge tone="assigned">Linked via Google</StatusBadge>
                  ) : (
                    <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                      Not connected to Google
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            className="surface"
            style={{
              padding: "24px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1px solid var(--line)",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontSize: "1.2rem", marginBottom: "16px", color: "var(--ink)" }}>
              Session Management
            </h2>

            <p style={{ fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.5, marginBottom: "20px" }}>
              Your session is protected with an encrypted opaque token stored in PostgreSQL. Token rotation and
              idle timeouts automatically protect your household account.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <form action={logoutAction}>
                <Button type="submit" variant="secondary" size="small">
                  Sign out
                </Button>
              </form>

              <form action={logoutAllAction}>
                <Button type="submit" variant="quiet" size="small" style={{ color: "var(--clay)" }}>
                  Sign out of all devices
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
