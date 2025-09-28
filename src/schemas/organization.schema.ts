import { z } from "zod";

// Organization settings schema
export const organizationSettingsSchema = z
  .object({
    timezone: z
      .string()
      .optional()
      .refine(
        tz => {
          if (!tz) return true;
          try {
            Intl.DateTimeFormat(undefined, { timeZone: tz });
            return true;
          } catch {
            return false;
          }
        },
        { message: "Invalid timezone" }
      ),
    workingDays: z
      .array(z.number().min(0).max(6))
      .min(1, "At least one working day is required")
      .max(7, "Cannot have more than 7 working days")
      .optional(),
    workingHours: z
      .object({
        start: z
          .string()
          .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Invalid time format (HH:MM)"
          ),
        end: z
          .string()
          .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Invalid time format (HH:MM)"
          ),
      })
      .optional(),
    companyAddress: z
      .object({
        street: z.string().min(1, "Street is required").optional(),
        city: z.string().min(1, "City is required").optional(),
        state: z.string().min(1, "State is required").optional(),
        postalCode: z.string().min(1, "Postal code is required").optional(),
        country: z.string().min(2, "Country is required").optional(),
      })
      .optional(),
    companyPhone: z
      .string()
      .regex(/^[+]?[1-9]?[0-9]{7,15}$/, "Invalid phone number format")
      .optional(),
    companyEmail: z.string().email("Invalid email format").optional(),
    logoUrl: z.string().url("Invalid URL format").optional(),
    fiscalYearStart: z
      .string()
      .regex(
        /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
        "Invalid date format (MM-DD)"
      )
      .optional(),
    currency: z
      .string()
      .length(3, "Currency code must be 3 characters")
      .regex(/^[A-Z]{3}$/, "Currency code must be in uppercase")
      .optional(),
    dateFormat: z
      .enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"])
      .optional(),
    timeFormat: z.enum(["12h", "24h"]).optional(),
  })
  .optional();

// Update organization schema
export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Organization name must not exceed 100 characters")
    .trim()
    .optional(),
  domain: z
    .string()
    .min(3, "Domain must be at least 3 characters")
    .max(50, "Domain must not exceed 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Domain can only contain lowercase letters, numbers, and hyphens"
    )
    .refine(domain => !domain.startsWith("-") && !domain.endsWith("-"), {
      message: "Domain cannot start or end with a hyphen",
    })
    .optional(),
  carryOverDays: z
    .number()
    .int("Carry over days must be an integer")
    .min(0, "Carry over days cannot be negative")
    .max(365, "Carry over days cannot exceed 365")
    .optional(),
  leaveRefreshDate: z
    .string()
    .refine(date => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .optional(),
  settings: organizationSettingsSchema,
});

// Get organization stats query schema
export const getOrganizationStatsSchema = z.object({
  includeInactive: z
    .string()
    .transform(val => val === "true")
    .optional(),
});

// Organization ID parameter schema
export const organizationIdParamSchema = z.object({
  id: z.string().cuid("Invalid organization ID"),
});

// Type definitions
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type OrganizationSettingsInput = z.infer<
  typeof organizationSettingsSchema
>;
export type GetOrganizationStatsInput = z.infer<
  typeof getOrganizationStatsSchema
>;
export type OrganizationIdParam = z.infer<typeof organizationIdParamSchema>;
