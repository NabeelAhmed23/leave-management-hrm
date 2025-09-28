import { z } from "zod";

// Create leave type schema
export const createLeaveTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .trim()
    .optional(),
  maxDaysPerYear: z
    .number()
    .int("Maximum days must be an integer")
    .min(1, "Maximum days must be at least 1")
    .max(365, "Maximum days cannot exceed 365"),
});

// Update leave type schema
export const updateLeaveTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .trim()
    .optional(),
  maxDaysPerYear: z
    .number()
    .int("Maximum days must be an integer")
    .min(1, "Maximum days must be at least 1")
    .max(365, "Maximum days cannot exceed 365")
    .optional(),
});

// Query leave types schema for API (accepts strings from query params)
export const queryLeaveTypesSchema = z.object({
  search: z.string().trim().optional(),
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, "Page must be greater than 0")
    .default("1"),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, "Limit must be between 1 and 100")
    .default("10"),
});

// Query leave types schema for client (accepts numbers)
export const queryLeaveTypesClientSchema = z.object({
  search: z.string().trim().optional(),
  page: z
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be greater than 0"),
  limit: z
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100"),
});

// Leave type ID parameter schema
export const leaveTypeIdParamSchema = z.object({
  id: z.string().cuid("Invalid leave type ID"),
});

// Type definitions
export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;
export type QueryLeaveTypesInput = z.infer<typeof queryLeaveTypesSchema>;
export type QueryLeaveTypesClientInput = z.infer<
  typeof queryLeaveTypesClientSchema
>;
export type LeaveTypeIdParam = z.infer<typeof leaveTypeIdParamSchema>;
