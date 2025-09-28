import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  CreateLeaveRequestDTO,
  UpdateLeaveRequestDTO,
  QueryLeavesDTO,
  CancelLeaveDTO,
  CheckLeaveBalanceDTO,
  LeaveRequestResponse,
  LeaveRequestsResponse,
  LeaveBalanceCheckResponse,
  DetailedLeaveRequest,
  LeaveBalanceCheckResult,
} from "@/types/leave.types";
import { AppError } from "@/utils/app-error";

// Query keys
export const leaveQueryKeys = {
  all: ["leaves"] as const,
  lists: () => [...leaveQueryKeys.all, "list"] as const,
  list: (filters: QueryLeavesDTO) =>
    [...leaveQueryKeys.lists(), { filters }] as const,
  details: () => [...leaveQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...leaveQueryKeys.details(), id] as const,
  balances: () => [...leaveQueryKeys.all, "balances"] as const,
  balanceCheck: () => [...leaveQueryKeys.all, "balance-check"] as const,
  types: () => [...leaveQueryKeys.all, "types"] as const,
};

// API functions
const leaveApi = {
  // Create leave request
  createLeaveRequest: async (
    data: CreateLeaveRequestDTO
  ): Promise<DetailedLeaveRequest> => {
    const response = await apiClient.post<LeaveRequestResponse>(
      "/leaves",
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to create leave request",
        500
      );
    }

    return response.data.data;
  },

  // Get all leave requests
  getLeaveRequests: async (
    params: QueryLeavesDTO
  ): Promise<{
    leaveRequests: DetailedLeaveRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const response = await apiClient.get<LeaveRequestsResponse>("/leaves", {
      params,
    });

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to fetch leave requests",
        500
      );
    }

    return response.data.data;
  },

  // Get single leave request
  getLeaveRequest: async (id: string): Promise<DetailedLeaveRequest> => {
    const response = await apiClient.get<LeaveRequestResponse>(`/leaves/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to fetch leave request",
        500
      );
    }

    return response.data.data;
  },

  // Update leave request
  updateLeaveRequest: async (
    id: string,
    data: UpdateLeaveRequestDTO
  ): Promise<DetailedLeaveRequest> => {
    const response = await apiClient.patch<LeaveRequestResponse>(
      `/leaves/${id}`,
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to update leave request",
        500
      );
    }

    return response.data.data;
  },

  // Cancel leave request
  cancelLeaveRequest: async (
    id: string,
    data?: CancelLeaveDTO
  ): Promise<DetailedLeaveRequest> => {
    const response = await apiClient.delete<LeaveRequestResponse>(
      `/leaves/${id}`,
      { data }
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to cancel leave request",
        500
      );
    }

    return response.data.data;
  },

  // Check leave balance
  checkLeaveBalance: async (
    data: CheckLeaveBalanceDTO
  ): Promise<LeaveBalanceCheckResult> => {
    const response = await apiClient.post<LeaveBalanceCheckResponse>(
      "/leaves/check-balance",
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to check leave balance",
        500
      );
    }

    return response.data.data;
  },
};

// React Query hooks

/**
 * Hook to create a leave request
 */
export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveApi.createLeaveRequest,
    onSuccess: data => {
      // Invalidate and refetch leave requests
      queryClient.invalidateQueries({ queryKey: leaveQueryKeys.lists() });

      // Add the new leave request to the cache
      queryClient.setQueryData(leaveQueryKeys.detail(data.id), data);
    },
    onError: () => {
      // Error handling is managed by React Query's error boundaries
    },
  });
}

/**
 * Hook to fetch all leave requests
 */
export function useLeaveRequests(params: QueryLeavesDTO = {}) {
  return useQuery({
    queryKey: leaveQueryKeys.list(params),
    queryFn: () => leaveApi.getLeaveRequests(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single leave request
 */
export function useLeaveRequest(id: string, enabled = true) {
  return useQuery({
    queryKey: leaveQueryKeys.detail(id),
    queryFn: () => leaveApi.getLeaveRequest(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update a leave request
 */
export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeaveRequestDTO }) =>
      leaveApi.updateLeaveRequest(id, data),
    onSuccess: (data, variables) => {
      // Update the specific leave request in cache
      queryClient.setQueryData(leaveQueryKeys.detail(variables.id), data);

      // Invalidate the list to ensure consistency
      queryClient.invalidateQueries({ queryKey: leaveQueryKeys.lists() });
    },
    onError: () => {
      // Error handling is managed by React Query's error boundaries
    },
  });
}

/**
 * Hook to cancel a leave request
 */
export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: CancelLeaveDTO }) =>
      leaveApi.cancelLeaveRequest(id, data),
    onSuccess: (data, variables) => {
      // Update the specific leave request in cache
      queryClient.setQueryData(leaveQueryKeys.detail(variables.id), data);

      // Invalidate the list to ensure consistency
      queryClient.invalidateQueries({ queryKey: leaveQueryKeys.lists() });
    },
    onError: () => {
      // Error handling is managed by React Query's error boundaries
    },
  });
}

/**
 * Hook to prefetch a leave request
 */
export function usePrefetchLeaveRequest() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: leaveQueryKeys.detail(id),
      queryFn: () => leaveApi.getLeaveRequest(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}

/**
 * Hook to get leave requests with optimistic updates
 */
export function useOptimisticLeaveRequests(params: QueryLeavesDTO = {}) {
  const queryClient = useQueryClient();
  const query = useLeaveRequests(params);

  const updateOptimistically = (
    id: string,
    updates: Partial<DetailedLeaveRequest>
  ) => {
    queryClient.setQueryData(
      leaveQueryKeys.list(params),
      (
        old:
          | {
              leaveRequests: DetailedLeaveRequest[];
              pagination: {
                page: number;
                limit: number;
                total: number;
                pages: number;
              };
            }
          | undefined
      ) => {
        if (!old) return old;

        return {
          ...old,
          leaveRequests: old.leaveRequests.map(leave =>
            leave.id === id ? { ...leave, ...updates } : leave
          ),
        };
      }
    );
  };

  return {
    ...query,
    updateOptimistically,
  };
}

/**
 * Hook to check leave balance for a specific date range and leave type
 */
export function useCheckLeaveBalance() {
  return useMutation({
    mutationFn: leaveApi.checkLeaveBalance,
    onSuccess: () => {
      // No cache updates needed for balance check as it's a read-only operation
    },
    onError: () => {
      // Error handling is managed by React Query's error boundaries
    },
  });
}

// Export the API functions for direct use if needed
export { leaveApi };
