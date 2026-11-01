import Link from "next/link";
import { Icon } from "./ui";
import { ServiceDTO } from "@/modules/services";

interface ServiceCardProps {
  service: ServiceDTO;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const iconName = (service.category?.icon || "bolt") as
    | "bolt"
    | "drop"
    | "sparkle"
    | "tools"
    | "gear"
    | "brush";

  const pricingLabel =
    service.pricingModel === "FLAT"
      ? "Flat rate"
      : service.pricingModel === "BASE_PLUS_HOURLY"
      ? "Base + parts/labor"
      : "Inspection first";

  return (
    <article className="service-card">
      <div className="service-icon" aria-hidden="true">
        <Icon name={iconName} />
      </div>

      {service.category?.name ? (
        <span className="eyebrow" style={{ marginBottom: "6px" }}>
          {service.category.name}
        </span>
      ) : null}

      <h3>{service.name}</h3>
      <p>{service.shortDescription}</p>

      <div className="service-price-tag">
        ₹{service.basePrice}
        <span>/{pricingLabel}</span>
      </div>

      <div className="service-duration-badge">
        <Icon name="clock" /> Est. {service.estimatedDurationMinutes} mins
      </div>

      <div className="service-card-footer">
        <span
          style={{
            fontSize: "0.78rem",
            color:
              service.serviceAreas && service.serviceAreas.length > 0
                ? "var(--moss)"
                : "var(--muted)",
            fontWeight: 600,
          }}
        >
          {service.serviceAreas && service.serviceAreas.length > 0
            ? `${service.serviceAreas.length} Gangtok area${
                service.serviceAreas.length === 1 ? "" : "s"
              }`
            : "Availability not configured"}
        </span>
        <Link
          href={`/services/${service.slug}`}
          className="service-card-action"
          aria-label={`View details and pricing for ${service.name}`}
        >
          View details <Icon name="arrow" />
        </Link>
      </div>
    </article>
  );
}
