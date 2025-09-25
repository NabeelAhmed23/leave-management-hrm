import { z } from "zod";

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters"),
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters")
    .optional(),
});

// Leave request schemas
export const leaveRequestSchema = z
  .object({
    leaveTypeId: z.string().cuid("Invalid leave type ID"),
    startDate: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Invalid start date",
    }),
    endDate: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: "Invalid end date",
    }),
    reason: z
      .string()
      .max(500, "Reason must not exceed 500 characters")
      .optional(),
  })
  .refine(
    data => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate >= startDate;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    }
  );

export const updateLeaveRequestStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
  comments: z
    .string()
    .max(500, "Comments must not exceed 500 characters")
    .optional(),
});

// Leave type schemas
export const leaveTypeSchema = z.object({
  name: z
    .string()
    .min(2, "Leave type name must be at least 2 characters")
    .max(50, "Leave type name must not exceed 50 characters"),
  description: z
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  maxDaysPerYear: z
    .number()
    .min(1, "Maximum days per year must be at least 1")
    .max(365, "Maximum days per year cannot exceed 365"),
  carryOverDays: z
    .number()
    .min(0, "Carry over days cannot be negative")
    .max(100, "Carry over days cannot exceed 100")
    .default(0),
});

// User schemas
export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters")
    .optional(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters")
    .optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "HR_ADMIN", "SUPER_ADMIN"]).optional(),
});

// Organization schemas
export const organizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters"),
  domain: z.string().min(2, "Domain must be at least 2 characters"),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// Query schemas
export const leaveRequestQuerySchema = paginationSchema.extend({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  userId: z.string().cuid().optional(),
  startDate: z
    .string()
    .refine(date => !isNaN(Date.parse(date)))
    .optional(),
  endDate: z
    .string()
    .refine(date => !isNaN(Date.parse(date)))
    .optional(),
});

// Type inference
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type UpdateLeaveRequestStatusInput = z.infer<
  typeof updateLeaveRequestStatusSchema
>;
export type LeaveTypeInput = z.infer<typeof leaveTypeSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type LeaveRequestQueryInput = z.infer<typeof leaveRequestQuerySchema>;
