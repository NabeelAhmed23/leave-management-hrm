import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

// Types from the service
export interface DashboardStats {
  availableLeaves: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  usedLeavesThisYear: number;
  teamOnLeave: number;
  presentEmployees?: number;
  pendingApprovals?: number;
  employeesOnLeave?: number;
}

export interface TodayEvent {
  id: string;
  type: "birthday" | "anniversary";
  employeeId: string;
  employeeName: string;
  department?: string;
  yearsOfService?: number;
  date: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  department?: string;
  isOnLeave: boolean;
  leaveType?: string;
  leaveEndDate?: Date;
}

export interface PendingLeaveRequest {
  id: string;
  employeeName: string;
  department?: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
  createdAt: Date;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats(): UseQueryResult<DashboardStats, Error> {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        const response =
          await apiClient.get<ApiResponse<DashboardStats>>("/dashboard/stats");

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to fetch dashboard stats"
          );
        }

        return response.data.data;
      } catch (error) {
        throw error;
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
}

/**
 * Hook to fetch today's events (birthdays and anniversaries)
 */
export function useTodayEvents(): UseQueryResult<TodayEvent[], Error> {
  return useQuery({
    queryKey: ["dashboard", "events"],
    queryFn: async (): Promise<TodayEvent[]> => {
      try {
        const response =
          await apiClient.get<ApiResponse<TodayEvent[]>>("/dashboard/events");

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to fetch today's events"
          );
        }

        // Parse dates
        return response.data.data.map(event => ({
          ...event,
          date: new Date(event.date),
        }));
      } catch (error) {
        throw error;
      }
    },
    refetchInterval: 60 * 60 * 1000, // Refetch every hour (events don't change often)
    staleTime: 30 * 60 * 1000, // Consider data stale after 30 minutes
  });
}

/**
 * Hook to fetch team status
 */
export function useTeamStatus(): UseQueryResult<TeamMember[], Error> {
  return useQuery({
    queryKey: ["dashboard", "team-status"],
    queryFn: async (): Promise<TeamMember[]> => {
      try {
        const response = await apiClient.get<ApiResponse<TeamMember[]>>(
          "/dashboard/team-status"
        );

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to fetch team status"
          );
        }

        // Parse dates
        return response.data.data.map(member => ({
          ...member,
          leaveEndDate: member.leaveEndDate
            ? new Date(member.leaveEndDate)
            : undefined,
        }));
      } catch (error) {
        throw error;
      }
    },
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
}

/**
 * Hook to fetch pending leave requests
 */
export function usePendingRequests(): UseQueryResult<
  PendingLeaveRequest[],
  Error
> {
  return useQuery({
    queryKey: ["dashboard", "pending-requests"],
    queryFn: async (): Promise<PendingLeaveRequest[]> => {
      try {
        const response = await apiClient.get<
          ApiResponse<PendingLeaveRequest[]>
        >("/dashboard/pending-requests");

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to fetch pending requests"
          );
        }

        // Parse dates
        return response.data.data.map(request => ({
          ...request,
          startDate: new Date(request.startDate),
          endDate: new Date(request.endDate),
          createdAt: new Date(request.createdAt),
        }));
      } catch (error) {
        throw error;
      }
    },
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes (most dynamic data)
    staleTime: 1 * 60 * 1000, // Consider data stale after 1 minute
  });
}

/**
 * Combined hook to fetch all dashboard data
 */
export function useDashboardData() {
  const statsQuery = useDashboardStats();
  const eventsQuery = useTodayEvents();
  const teamStatusQuery = useTeamStatus();
  const pendingRequestsQuery = usePendingRequests();

  return {
    stats: statsQuery,
    events: eventsQuery,
    teamStatus: teamStatusQuery,
    pendingRequests: pendingRequestsQuery,
    isLoading:
      statsQuery.isLoading ||
      eventsQuery.isLoading ||
      teamStatusQuery.isLoading ||
      pendingRequestsQuery.isLoading,
    isError:
      statsQuery.isError ||
      eventsQuery.isError ||
      teamStatusQuery.isError ||
      pendingRequestsQuery.isError,
    error:
      statsQuery.error ||
      eventsQuery.error ||
      teamStatusQuery.error ||
      pendingRequestsQuery.error,
  };
}
