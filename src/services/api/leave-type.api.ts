import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  CreateLeaveTypeDTO,
  UpdateLeaveTypeDTO,
  QueryLeaveTypesDTO,
  LeaveTypeResponse,
  LeaveTypesResponse,
  DetailedLeaveType,
} from "@/types/leave-type.types";
import { AppError } from "@/utils/app-error";

// Query keys
export const leaveTypeQueryKeys = {
  all: ["leave-types"] as const,
  lists: () => [...leaveTypeQueryKeys.all, "list"] as const,
  list: (filters: QueryLeaveTypesDTO) =>
    [...leaveTypeQueryKeys.lists(), { filters }] as const,
  details: () => [...leaveTypeQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...leaveTypeQueryKeys.details(), id] as const,
  simple: () => [...leaveTypeQueryKeys.all, "simple"] as const,
};

// API functions
const leaveTypeApi = {
  // Create leave type
  createLeaveType: async (
    data: CreateLeaveTypeDTO
  ): Promise<DetailedLeaveType> => {
    const response = await apiClient.post<LeaveTypeResponse>(
      "/leave-types",
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to create leave type",
        500
      );
    }

    return response.data.data;
  },

  // Get all leave types
  getLeaveTypes: async (
    params: QueryLeaveTypesDTO
  ): Promise<{
    leaveTypes: DetailedLeaveType[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const response = await apiClient.get<LeaveTypesResponse>("/leave-types", {
      params,
    });

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to fetch leave types",
        500
      );
    }

    return response.data.data;
  },

  // Get single leave type
  getLeaveType: async (id: string): Promise<DetailedLeaveType> => {
    const response = await apiClient.get<LeaveTypeResponse>(
      `/leave-types/${id}`
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to fetch leave type",
        500
      );
    }

    return response.data.data;
  },

  // Get simple leave types (for dropdowns)
  getSimpleLeaveTypes: async (): Promise<
    Array<{ id: string; name: string; maxDaysPerYear: number }>
  > => {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: Array<{ id: string; name: string; maxDaysPerYear: number }>;
    }>("/leave-types/simple");

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to fetch leave types",
        500
      );
    }

    return response.data.data;
  },

  // Update leave type
  updateLeaveType: async (
    id: string,
    data: UpdateLeaveTypeDTO
  ): Promise<DetailedLeaveType> => {
    const response = await apiClient.patch<LeaveTypeResponse>(
      `/leave-types/${id}`,
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to update leave type",
        500
      );
    }

    return response.data.data;
  },

  // Delete leave type
  deleteLeaveType: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/leave-types/${id}`);

    if (!response.data.success) {
      throw new AppError(
        response.data.message || "Failed to delete leave type",
        500
      );
    }

    return { message: response.data.message };
  },
};

// React Query hooks

/**
 * Hook to create a leave type
 */
export function useCreateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveTypeApi.createLeaveType,
    onSuccess: data => {
      // Invalidate and refetch leave types
      queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.simple() });

      // Add the new leave type to the cache
      queryClient.setQueryData(leaveTypeQueryKeys.detail(data.id), data);
    },
    onError: () => {
      // Error handling is managed by React Query's error boundaries
    },
  });
}

/**
 * Hook to fetch all leave types
 */
export function useLeaveTypes(params: Partial<QueryLeaveTypesDTO> = {}) {
  const paramsWithDefaults: QueryLeaveTypesDTO = {
    page: 1,
    limit: 10,
    ...params,
  };
  return useQuery({
    queryKey: leaveTypeQueryKeys.list(paramsWithDefaults),
    queryFn: () => leaveTypeApi.getLeaveTypes(paramsWithDefaults),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single leave type
 */
export function useLeaveType(id: string, enabled = true) {
  return useQuery({
    queryKey: leaveTypeQueryKeys.detail(id),
    queryFn: () => leaveTypeApi.getLeaveType(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch simple leave types (for dropdowns)
 */
export function useSimpleLeaveTypes(enabled = true) {
  return useQuery({
    queryKey: leaveTypeQueryKeys.simple(),
    queryFn: () => leaveTypeApi.getSimpleLeaveTypes(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes (longer cache since this changes less frequently)
  });
}

/**
 * Hook to update a leave type
 */
export function useUpdateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeaveTypeDTO }) =>
      leaveTypeApi.updateLeaveType(id, data),
    onSuccess: (data, variables) => {
      // Update the specific leave type in cache
      queryClient.setQueryData(leaveTypeQueryKeys.detail(variables.id), data);

      // Invalidate the lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.simple() });
    },
    onError: () => {
      // Error handling is managed by React Query's error boundaries
    },
  });
}

/**
 * Hook to delete a leave type
 */
export function useDeleteLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveTypeApi.deleteLeaveType,
    onSuccess: (_, deletedId) => {
      // Remove the deleted leave type from cache
      queryClient.removeQueries({
        queryKey: leaveTypeQueryKeys.detail(deletedId),
      });

      // Invalidate the lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.simple() });
    },
    onError: () => {
      // Error handling is managed by React Query's error boundaries
    },
  });
}

/**
 * Hook to prefetch a leave type
 */
export function usePrefetchLeaveType() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: leaveTypeQueryKeys.detail(id),
      queryFn: () => leaveTypeApi.getLeaveType(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}

/**
 * Hook to get leave types with optimistic updates
 */
export function useOptimisticLeaveTypes(
  params: Partial<QueryLeaveTypesDTO> = {}
) {
  const paramsWithDefaults: QueryLeaveTypesDTO = {
    page: 1,
    limit: 10,
    ...params,
  };
  const queryClient = useQueryClient();
  const query = useLeaveTypes(params);

  const updateOptimistically = (
    id: string,
    updates: Partial<DetailedLeaveType>
  ) => {
    queryClient.setQueryData(
      leaveTypeQueryKeys.list(paramsWithDefaults),
      (
        old:
          | {
              leaveTypes: DetailedLeaveType[];
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
          leaveTypes: old.leaveTypes.map(leaveType =>
            leaveType.id === id ? { ...leaveType, ...updates } : leaveType
          ),
        };
      }
    );
  };

  const removeOptimistically = (id: string) => {
    queryClient.setQueryData(
      leaveTypeQueryKeys.list(paramsWithDefaults),
      (
        old:
          | {
              leaveTypes: DetailedLeaveType[];
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
          leaveTypes: old.leaveTypes.filter(leaveType => leaveType.id !== id),
          pagination: {
            ...old.pagination,
            total: Math.max(0, old.pagination.total - 1),
          },
        };
      }
    );
  };

  return {
    ...query,
    updateOptimistically,
    removeOptimistically,
  };
}

// Export the API functions for direct use if needed
export { leaveTypeApi };
