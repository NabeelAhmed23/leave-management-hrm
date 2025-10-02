import { z } from "zod";

/**
 * Schema for calendar leave query
 */
export const calendarLeaveQuerySchema = z.object({
  type: z.enum(["SELF", "TEAM"], {
    required_error: "Type is required",
    invalid_type_error: "Type must be either SELF or TEAM",
  }),
  startDate: z
    .string()
    .nullable()
    .optional()
    .refine(
      val => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Invalid start date format" }
    ),
  endDate: z
    .string()
    .nullable()
    .optional()
    .refine(
      val => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Invalid end date format" }
    ),
});

export type CalendarLeaveQueryInput = z.infer<typeof calendarLeaveQuerySchema>;
