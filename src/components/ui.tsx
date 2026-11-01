import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({ children, variant = "primary", size, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" | "light"; size?: "small" }) { return <button className={`button button-${variant}${size ? ` button-${size}` : ""} ${className}`} type="button" {...props}>{children}</button>; }
export function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) { return <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{copy}</p></div>; }
export function Surface({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) { return <article className="surface"><p className="eyebrow">{eyebrow}</p><h3>{title}</h3>{children}</article>; }
export function StatusBadge({ tone, children }: { tone: "pending" | "assigned" | "success" | "danger"; children: ReactNode }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
export function Notice({ title, children }: { title: string; children: ReactNode }) { return <div className="notice" role="note"><Icon name="info" /><div><strong>{title}</strong>{children}</div></div>; }
export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) { const id = props.id ?? label.toLowerCase().replaceAll(" ", "-"); return <div className="field"><label htmlFor={id}>{label}</label><input id={id} {...props} />{hint ? <small>{hint}</small> : null}</div>; }
export function Icon({ name }: { name: "home" | "menu" | "arrow" | "pin" | "calendar" | "bolt" | "drop" | "sparkle" | "info" | "check" | "tools" | "gear" | "brush" | "search" | "clock" | "shield" }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 21v-6h6v6" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7z" />,
    drop: <path d="M12 2s7 7.1 7 12a7 7 0 1 1-14 0c0-4.9 7-12 7-12Z" />,
    sparkle: <path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    check: <path d="m5 12 4.2 4L19 6" />,
    tools: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
    brush: <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08a4 4 0 0 1-2.4 1.15l-4.7.7a1 1 0 0 1-1.13-1.14l.73-4.7a4 4 0 0 1 1.14-2.4z" />,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name] || paths.info}</svg>;
}
