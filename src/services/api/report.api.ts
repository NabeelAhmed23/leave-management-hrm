import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  QueryReportsDTO,
  ReportData,
  ReportResponse,
} from "@/types/report.types";
import { AppError } from "@/utils/app-error";

// Query keys
export const reportQueryKeys = {
  all: ["reports"] as const,
  lists: () => [...reportQueryKeys.all, "list"] as const,
  list: (filters: QueryReportsDTO) =>
    [...reportQueryKeys.lists(), { filters }] as const,
};

// API functions
const reportApi = {
  // Get reports
  getReports: async (params: QueryReportsDTO): Promise<ReportData> => {
    const response = await apiClient.get<ReportResponse>("/reports", {
      params,
    });

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to fetch reports",
        500
      );
    }

    return response.data.data;
  },
};

// React Query hooks

/**
 * Hook to fetch reports with filters
 */
export function useReports(params: QueryReportsDTO = {}) {
  return useQuery({
    queryKey: reportQueryKeys.list(params),
    queryFn: () => reportApi.getReports(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Export the API functions for direct use if needed
export { reportApi };
