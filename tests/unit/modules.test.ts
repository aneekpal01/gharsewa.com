import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Modular Monolith Structure (src/modules)", () => {
  const expectedModules = [
    "auth",
    "users",
    "customers",
    "workers",
    "services",
    "service-areas",
    "addresses",
    "bookings",
    "assignments",
    "payments",
    "reviews",
    "complaints",
    "notifications",
    "audit",
    "admin",
  ];

  it("contains all 15 required domain module boundaries", () => {
    const modulesDir = path.resolve(__dirname, "../../src/modules");
    expect(fs.existsSync(modulesDir)).toBe(true);

    for (const mod of expectedModules) {
      const modPath = path.join(modulesDir, mod);
      expect(fs.existsSync(modPath), `Module folder missing: ${mod}`).toBe(true);
      expect(fs.statSync(modPath).isDirectory()).toBe(true);

      const readmePath = path.join(modPath, "README.md");
      expect(fs.existsSync(readmePath), `Module README missing: ${mod}`).toBe(true);
    }
  });
});
