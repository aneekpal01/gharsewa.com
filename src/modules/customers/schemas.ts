import { z } from "zod";

export const updateCustomerProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  preferredLanguage: z
    .enum(["en", "ne", "hi"], {
      message: "Supported languages are English, Nepali, and Hindi",
    })
    .optional(),
  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),
});
