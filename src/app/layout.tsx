import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GharSewa | Home Services in Gangtok",
  description: "A dependable local home-services platform for Gangtok."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
