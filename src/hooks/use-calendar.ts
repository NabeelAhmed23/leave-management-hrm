import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

// Types for calendar events
export interface CalendarLeaveEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  employeeName: string;
  employeeId: string;
  leaveType: string;
  leaveTypeId: string;
  color: string;
  reason?: string;
  department?: string;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type CalendarViewType = "SELF" | "TEAM";

export interface CalendarQueryParams {
  type: CalendarViewType;
  startDate?: string;
  endDate?: string;
}

/**
 * Hook to fetch calendar leave events
 */
export function useCalendarLeaves(
  params: CalendarQueryParams
): UseQueryResult<CalendarLeaveEvent[], Error> {
  return useQuery({
    queryKey: [
      "calendar",
      "leaves",
      params.type,
      params.startDate,
      params.endDate,
    ],
    queryFn: async (): Promise<CalendarLeaveEvent[]> => {
      try {
        const response = await apiClient.get<ApiResponse<CalendarLeaveEvent[]>>(
          "/calendar/leaves",
          {
            params: {
              type: params.type,
              ...(params.startDate && { startDate: params.startDate }),
              ...(params.endDate && { endDate: params.endDate }),
            },
          }
        );

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to fetch calendar leave events"
          );
        }

        // Parse dates from strings to Date objects
        return response.data.data.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));
      } catch (error) {
        throw error;
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
}
