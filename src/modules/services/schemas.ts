import { z } from "zod";

const stringOrArrayString = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val[0];
    return val;
  });

export const serviceFiltersSchema = z.object({
  query: stringOrArrayString
    .pipe(
      z
        .string()
        .trim()
        .max(100, "Search query must be 100 characters or fewer")
        .optional()
        .transform((val) => (val && val.length > 0 ? val : undefined))
    )
    .optional(),
  category: stringOrArrayString
    .pipe(
      z
        .string()
        .trim()
        .max(100)
        .regex(/^[a-z0-9-]+$/, "Category slug must be kebab-case")
        .optional()
        .transform((val) => (val && val.length > 0 && val !== "all" ? val : undefined))
    )
    .optional(),
  locality: stringOrArrayString
    .pipe(
      z
        .string()
        .trim()
        .max(100)
        .regex(/^[a-z0-9-]+$/, "Locality slug must be kebab-case")
        .optional()
        .transform((val) => (val && val.length > 0 && val !== "all" ? val : undefined))
    )
    .optional(),
});

export const serviceSlugSchema = z
  .string()
  .trim()
  .min(2, "Service slug must have at least 2 characters")
  .max(150, "Service slug too long")
  .regex(/^[a-z0-9-]+$/, "Service slug must be lowercase alphanumeric with hyphens");
