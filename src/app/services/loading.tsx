import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function ServicesLoading() {
  return (
    <main className="site-shell">
      <SiteHeader currentPath="/services" />

      <div className="section" style={{ paddingTop: "40px" }}>
        <div style={{ maxWidth: "600px", marginBottom: "32px" }}>
          <div className="skeleton" style={{ height: "16px", width: "140px", marginBottom: "12px" }} />
          <div className="skeleton" style={{ height: "36px", width: "320px", marginBottom: "14px" }} />
          <div className="skeleton" style={{ height: "20px", width: "480px" }} />
        </div>

        <div className="service-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton" style={{ height: "44px", width: "44px", borderRadius: "50%", marginBottom: "20px" }} />
              <div className="skeleton" style={{ height: "16px", width: "100px", marginBottom: "10px" }} />
              <div className="skeleton" style={{ height: "24px", width: "200px", marginBottom: "12px" }} />
              <div className="skeleton" style={{ height: "16px", width: "100%", marginBottom: "8px" }} />
              <div className="skeleton" style={{ height: "16px", width: "80%", marginBottom: "20px" }} />
              <div className="skeleton" style={{ height: "28px", width: "120px", marginTop: "auto" }} />
            </div>
          ))}
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
