import { z } from "zod";

// Create employee schema
export const createEmployeeSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must not exceed 50 characters")
    .trim(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must not exceed 50 characters")
    .trim(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters")
    .trim()
    .toLowerCase(),
  departmentId: z.string().cuid("Invalid department ID").optional(),
  jobTitle: z
    .string()
    .max(100, "Job title must not exceed 100 characters")
    .trim()
    .optional(),
  managerId: z.string().cuid("Invalid manager ID").optional(),
  role: z
    .enum(["EMPLOYEE", "MANAGER", "HR_ADMIN", "SUPER_ADMIN"])
    .default("EMPLOYEE"),
  startDate: z.string().datetime("Invalid start date").or(z.date()),
  endDate: z.string().datetime("Invalid end date").or(z.date()).optional(),
  isActive: z.boolean().default(true),
  sendInvite: z.boolean().default(true),
  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .trim()
    .optional(),
  address: z
    .string()
    .max(500, "Address must not exceed 500 characters")
    .trim()
    .optional(),
});

// Update employee schema
export const updateEmployeeSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must not exceed 50 characters")
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must not exceed 50 characters")
    .trim()
    .optional(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters")
    .trim()
    .toLowerCase()
    .optional(),
  employeeNumber: z
    .string()
    .min(1, "Employee number is required")
    .max(20, "Employee number must not exceed 20 characters")
    .trim()
    .optional(),
  departmentId: z.string().cuid("Invalid department ID").nullable().optional(),
  jobTitle: z
    .string()
    .max(100, "Job title must not exceed 100 characters")
    .trim()
    .nullable()
    .optional(),
  managerId: z.string().cuid("Invalid manager ID").nullable().optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "HR_ADMIN", "SUPER_ADMIN"]).optional(),
  startDate: z.string().datetime("Invalid start date").or(z.date()).optional(),
  endDate: z
    .string()
    .datetime("Invalid end date")
    .or(z.date())
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .trim()
    .nullable()
    .optional(),
  address: z
    .string()
    .max(500, "Address must not exceed 500 characters")
    .trim()
    .nullable()
    .optional(),
});

// Query employees schema for API (accepts strings from query params)
export const queryEmployeesSchema = z.object({
  search: z.string().trim().optional(),
  departmentId: z.string().cuid("Invalid department ID").optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "HR_ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z
    .string()
    .transform(val => val === "true")
    .optional(),
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, "Page must be greater than 0")
    .default("1"),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 0 && val <= 100, "Limit must be between 0 and 100")
    .default("10"),
});

// Query employees schema for client (accepts numbers)
export const queryEmployeesClientSchema = z.object({
  search: z.string().trim().optional(),
  departmentId: z.string().cuid("Invalid department ID").optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "HR_ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z.boolean().optional(),
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

// Employee ID parameter schema
export const employeeIdParamSchema = z.object({
  id: z.string().cuid("Invalid employee ID"),
});

// Invite employee schema
export const inviteEmployeeSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters")
    .trim()
    .toLowerCase(),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must not exceed 50 characters")
    .trim(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must not exceed 50 characters")
    .trim(),
});

// Setup password schema
export const setupPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Type definitions
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type QueryEmployeesInput = z.infer<typeof queryEmployeesSchema>;
export type QueryEmployeesClientInput = z.infer<
  typeof queryEmployeesClientSchema
>;
export type EmployeeIdParam = z.infer<typeof employeeIdParamSchema>;
export type InviteEmployeeInput = z.infer<typeof inviteEmployeeSchema>;
export type SetupPasswordInput = z.infer<typeof setupPasswordSchema>;
