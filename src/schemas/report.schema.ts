import { z } from "zod";

/**
 * Schema for querying reports
 */
export const queryReportsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  year: z.coerce.number().optional(),
  departmentId: z.string().optional(),
  leaveTypeId: z.string().optional(),
});

export type QueryReportsInput = z.infer<typeof queryReportsSchema>;
