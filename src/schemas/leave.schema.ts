import { z } from "zod";
import { LeaveStatus } from "@prisma/client";

// Date validation helpers
const dateSchema = z
  .string()
  .refine(date => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  })
  .transform(date => new Date(date));

const futureDateSchema = dateSchema.refine(date => date > new Date(), {
  message: "Date must be in the future",
});

// Create leave request schema
export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z
      .string()
      .min(1, "Leave type is required")
      .cuid("Invalid leave type ID"),
    startDate: futureDateSchema,
    endDate: futureDateSchema,
    reason: z
      .string()
      .max(500, "Reason must not exceed 500 characters")
      .optional(),
  })
  .refine(data => data.endDate >= data.startDate, {
    message: "End date must be equal to or after start date",
    path: ["endDate"],
  });

// Update leave request schema
export const updateLeaveRequestSchema = z
  .object({
    leaveTypeId: z
      .string()
      .min(1, "Leave type is required")
      .cuid("Invalid leave type ID")
      .optional(),
    startDate: futureDateSchema.optional(),
    endDate: futureDateSchema.optional(),
    reason: z
      .string()
      .max(500, "Reason must not exceed 500 characters")
      .optional(),
  })
  .refine(
    data => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "End date must be equal to or after start date",
      path: ["endDate"],
    }
  );

// Query leaves schema
export const queryLeavesSchema = z.object({
  status: z
    .enum([
      LeaveStatus.PENDING,
      LeaveStatus.APPROVED,
      LeaveStatus.REJECTED,
      LeaveStatus.CANCELLED,
    ])
    .optional(),
  leaveTypeId: z.string().cuid("Invalid leave type ID").optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
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

// Leave action schemas (for approval/rejection)
export const approveLeaveSchema = z.object({
  comment: z
    .string()
    .max(500, "Comment must not exceed 500 characters")
    .optional(),
});

export const rejectLeaveSchema = z.object({
  comment: z
    .string()
    .min(1, "Rejection reason is required")
    .max(500, "Comment must not exceed 500 characters"),
});

// Cancel leave schema
export const cancelLeaveSchema = z.object({
  reason: z
    .string()
    .max(500, "Cancellation reason must not exceed 500 characters")
    .optional(),
});

// Check leave balance schema
export const checkLeaveBalanceSchema = z
  .object({
    leaveTypeId: z
      .string()
      .min(1, "Leave type is required")
      .cuid("Invalid leave type ID"),
    startDate: futureDateSchema,
    endDate: futureDateSchema,
  })
  .refine(data => data.endDate >= data.startDate, {
    message: "End date must be equal to or after start date",
    path: ["endDate"],
  });

// Leave ID parameter schema
export const leaveIdParamSchema = z.object({
  id: z.string().cuid("Invalid leave request ID"),
});

// Type definitions
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type UpdateLeaveRequestInput = z.infer<typeof updateLeaveRequestSchema>;
export type QueryLeavesInput = z.infer<typeof queryLeavesSchema>;
export type ApproveLeaveInput = z.infer<typeof approveLeaveSchema>;
export type RejectLeaveInput = z.infer<typeof rejectLeaveSchema>;
export type CancelLeaveInput = z.infer<typeof cancelLeaveSchema>;
export type CheckLeaveBalanceInput = z.infer<typeof checkLeaveBalanceSchema>;
export type LeaveIdParam = z.infer<typeof leaveIdParamSchema>;
