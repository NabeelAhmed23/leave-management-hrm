import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  UpdateOrganizationDTO,
  GetOrganizationStatsDTO,
  OrganizationResponse,
  OrganizationStatsResponse,
  DetailedOrganization,
  OrganizationStats,
} from "@/types/organization.types";
import { AppError } from "@/utils/app-error";

// Query keys
export const organizationQueryKeys = {
  all: ["organization"] as const,
  details: () => [...organizationQueryKeys.all, "detail"] as const,
  stats: () => [...organizationQueryKeys.all, "stats"] as const,
  statsWithParams: (params: GetOrganizationStatsDTO) =>
    [...organizationQueryKeys.stats(), { params }] as const,
};

// API functions
const organizationApi = {
  // Get organization details
  getOrganization: async (): Promise<DetailedOrganization> => {
    const response = await apiClient.get<OrganizationResponse>("/organization");

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to fetch organization details",
        500
      );
    }

    return response.data.data;
  },

  // Update organization
  updateOrganization: async (
    data: UpdateOrganizationDTO
  ): Promise<DetailedOrganization> => {
    const response = await apiClient.patch<OrganizationResponse>(
      "/organization",
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to update organization",
        500
      );
    }

    return response.data.data;
  },

  // Get organization statistics
  getOrganizationStats: async (
    params: GetOrganizationStatsDTO = {}
  ): Promise<OrganizationStats> => {
    const response = await apiClient.get<OrganizationStatsResponse>(
      "/organization/stats",
      { params }
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to fetch organization statistics",
        500
      );
    }

    return response.data.data;
  },
};

// React Query hooks

/**
 * Hook to fetch organization details
 */
export function useOrganization(enabled = true) {
  return useQuery({
    queryKey: organizationQueryKeys.details(),
    queryFn: () => organizationApi.getOrganization(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to update organization
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationApi.updateOrganization,
    onSuccess: data => {
      // Update the organization details in cache
      queryClient.setQueryData(organizationQueryKeys.details(), data);

      // Invalidate stats as they might have changed
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.stats(),
      });
    },
    onError: () => {
      // Error handling is managed by React Query's error boundaries
    },
  });
}

/**
 * Hook to fetch organization statistics
 */
export function useOrganizationStats(
  params: GetOrganizationStatsDTO = {},
  enabled = true
) {
  return useQuery({
    queryKey: organizationQueryKeys.statsWithParams(params),
    queryFn: () => organizationApi.getOrganizationStats(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to prefetch organization data
 */
export function usePrefetchOrganization() {
  const queryClient = useQueryClient();

  return {
    prefetchDetails: () => {
      queryClient.prefetchQuery({
        queryKey: organizationQueryKeys.details(),
        queryFn: () => organizationApi.getOrganization(),
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    },
    prefetchStats: (params: GetOrganizationStatsDTO = {}) => {
      queryClient.prefetchQuery({
        queryKey: organizationQueryKeys.statsWithParams(params),
        queryFn: () => organizationApi.getOrganizationStats(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
  };
}

/**
 * Hook to get organization data with optimistic updates
 */
export function useOptimisticOrganization() {
  const queryClient = useQueryClient();
  const query = useOrganization();

  const updateOptimistically = (updates: Partial<DetailedOrganization>) => {
    queryClient.setQueryData(
      organizationQueryKeys.details(),
      (old: DetailedOrganization | undefined) => {
        if (!old) return old;
        return { ...old, ...updates };
      }
    );
  };

  const revertOptimisticUpdate = () => {
    queryClient.invalidateQueries({
      queryKey: organizationQueryKeys.details(),
    });
  };

  return {
    ...query,
    updateOptimistically,
    revertOptimisticUpdate,
  };
}

/**
 * Hook to invalidate organization cache
 */
export function useInvalidateOrganization() {
  const queryClient = useQueryClient();

  return {
    invalidateDetails: () => {
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.details(),
      });
    },
    invalidateStats: () => {
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.stats(),
      });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.all,
      });
    },
  };
}

/**
 * Hook to check if organization data is cached
 */
export function useOrganizationCache() {
  const queryClient = useQueryClient();

  return {
    hasDetails: () => {
      const data = queryClient.getQueryData(organizationQueryKeys.details());
      return !!data;
    },
    hasStats: (params: GetOrganizationStatsDTO = {}) => {
      const data = queryClient.getQueryData(
        organizationQueryKeys.statsWithParams(params)
      );
      return !!data;
    },
    getDetails: () => {
      return queryClient.getQueryData<DetailedOrganization>(
        organizationQueryKeys.details()
      );
    },
    getStats: (params: GetOrganizationStatsDTO = {}) => {
      return queryClient.getQueryData<OrganizationStats>(
        organizationQueryKeys.statsWithParams(params)
      );
    },
  };
}

// Export the API functions for direct use if needed
export { organizationApi };
