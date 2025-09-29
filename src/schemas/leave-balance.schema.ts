import { z } from "zod";

// Assign leave type to employee schema
export const assignLeaveTypeSchema = z.object({
  leaveTypeId: z.string().cuid("Invalid leave type ID"),
  year: z
    .number()
    .int("Year must be an integer")
    .min(2020, "Year must be 2020 or later")
    .max(
      new Date().getFullYear() + 5,
      "Year cannot be more than 5 years in the future"
    ),
  totalDays: z
    .number()
    .int("Total days must be an integer")
    .min(0, "Total days must be 0 or greater")
    .max(365, "Total days cannot exceed 365"),
  carriedOver: z
    .number()
    .int("Carried over days must be an integer")
    .min(0, "Carried over days must be 0 or greater")
    .max(365, "Carried over days cannot exceed 365"),
});

// Update leave balance schema
export const updateLeaveBalanceSchema = z.object({
  totalDays: z
    .number()
    .int("Total days must be an integer")
    .min(0, "Total days must be 0 or greater")
    .max(365, "Total days cannot exceed 365")
    .optional(),
  carriedOver: z
    .number()
    .int("Carried over days must be an integer")
    .min(0, "Carried over days must be 0 or greater")
    .max(365, "Carried over days cannot exceed 365")
    .optional(),
});

// Bulk assign leave types schema (for multiple employees)
export const bulkAssignLeaveTypeSchema = z.object({
  employeeIds: z
    .array(z.string().cuid("Invalid employee ID"))
    .min(1, "At least one employee must be selected")
    .max(100, "Cannot assign to more than 100 employees at once"),
  leaveTypeId: z.string().cuid("Invalid leave type ID"),
  year: z
    .number()
    .int("Year must be an integer")
    .min(2020, "Year must be 2020 or later")
    .max(
      new Date().getFullYear() + 5,
      "Year cannot be more than 5 years in the future"
    ),
  totalDays: z
    .number()
    .int("Total days must be an integer")
    .min(0, "Total days must be 0 or greater")
    .max(365, "Total days cannot exceed 365"),
  carriedOver: z
    .number()
    .int("Carried over days must be an integer")
    .min(0, "Carried over days must be 0 or greater")
    .max(365, "Carried over days cannot exceed 365"),
});

// Query leave balances schema
export const queryLeaveBalancesSchema = z.object({
  year: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(
      val => val >= 2020 && val <= new Date().getFullYear() + 5,
      "Year must be between 2020 and 5 years in the future"
    )
    .optional(),
  leaveTypeId: z.string().cuid("Invalid leave type ID").optional(),
});

// Leave balance ID parameter schema
export const leaveBalanceIdParamSchema = z.object({
  id: z.string().cuid("Invalid leave balance ID"),
});

// Employee ID parameter schema
export const employeeIdParamSchema = z.object({
  id: z.string().cuid("Invalid employee ID"),
});

// Type definitions
export type AssignLeaveTypeInput = z.infer<typeof assignLeaveTypeSchema>;
export type UpdateLeaveBalanceInput = z.infer<typeof updateLeaveBalanceSchema>;
export type BulkAssignLeaveTypeInput = z.infer<
  typeof bulkAssignLeaveTypeSchema
>;
export type QueryLeaveBalancesInput = z.infer<typeof queryLeaveBalancesSchema>;
export type LeaveBalanceIdParam = z.infer<typeof leaveBalanceIdParamSchema>;
export type EmployeeIdParam = z.infer<typeof employeeIdParamSchema>;
