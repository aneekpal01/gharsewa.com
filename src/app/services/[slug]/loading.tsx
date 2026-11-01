import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function ServiceDetailLoading() {
  return (
    <main className="site-shell">
      <SiteHeader currentPath="/services" />

      <div className="section" style={{ paddingTop: "32px" }}>
        <div className="skeleton" style={{ height: "16px", width: "220px", marginBottom: "24px" }} />

        <div className="detail-grid">
          <div className="detail-main">
            <div className="skeleton" style={{ height: "14px", width: "120px", marginBottom: "12px" }} />
            <div className="skeleton" style={{ height: "48px", width: "80%", marginBottom: "16px" }} />
            <div className="skeleton" style={{ height: "20px", width: "100%", marginBottom: "8px" }} />
            <div className="skeleton" style={{ height: "20px", width: "90%", marginBottom: "32px" }} />

            <div className="skeleton-card" style={{ height: "200px", marginBottom: "20px" }} />
            <div className="skeleton-card" style={{ height: "200px" }} />
          </div>

          <aside className="detail-sidebar">
            <div className="skeleton-card" style={{ height: "380px" }} />
          </aside>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
