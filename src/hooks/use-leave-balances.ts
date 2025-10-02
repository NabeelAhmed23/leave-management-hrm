import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leaveBalanceApi } from "@/services/api/leave-balance.api";
import {
  CreateLeaveBalanceDTO,
  UpdateLeaveBalanceDTO,
  QueryLeaveBalancesDTO,
  BulkAssignmentResult,
  DetailedLeaveBalance,
} from "@/types/leave-balance.types";
import { toast } from "sonner";

// Query keys
export const leaveBalanceKeys = {
  all: ["leave-balances"] as const,
  employee: (employeeId: string) =>
    [...leaveBalanceKeys.all, "employee", employeeId] as const,
  employeeWithQuery: (employeeId: string, query?: QueryLeaveBalancesDTO) =>
    [...leaveBalanceKeys.employee(employeeId), query] as const,
  detail: (id: string) => [...leaveBalanceKeys.all, "detail", id] as const,
  assignedToLeaveType: (leaveTypeId: string, year?: number) =>
    [...leaveBalanceKeys.all, "leave-type", leaveTypeId, year] as const,
};

/**
 * Hook to get employee leave balances
 */
export function useEmployeeLeaveBalances(
  employeeId: string,
  params?: QueryLeaveBalancesDTO,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: leaveBalanceKeys.employeeWithQuery(employeeId, params),
    queryFn: () => leaveBalanceApi.getEmployeeLeaveBalances(employeeId, params),
    enabled: options?.enabled !== false && !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get leave balance by ID
 */
export function useLeaveBalance(
  leaveBalanceId: string,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: leaveBalanceKeys.detail(leaveBalanceId),
    queryFn: () => leaveBalanceApi.getLeaveBalanceById(leaveBalanceId),
    enabled: options?.enabled !== false && !!leaveBalanceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to assign leave type to employee
 */
export function useAssignLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      data,
    }: {
      employeeId: string;
      data: CreateLeaveBalanceDTO;
    }) => leaveBalanceApi.assignLeaveTypeToEmployee(employeeId, data),
    onSuccess: (data, variables) => {
      toast.success("Leave type assigned successfully");

      // Invalidate employee leave balances
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.employee(variables.employeeId),
      });

      // Invalidate all leave balances queries
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.all,
      });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to assign leave type";
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook to update leave balance
 */
export function useUpdateLeaveBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leaveBalanceId,
      data,
    }: {
      leaveBalanceId: string;
      data: UpdateLeaveBalanceDTO;
    }) => leaveBalanceApi.updateLeaveBalance(leaveBalanceId, data),
    onSuccess: (data: DetailedLeaveBalance) => {
      toast.success("Leave balance updated successfully");

      // Update the specific leave balance in cache
      queryClient.setQueryData(leaveBalanceKeys.detail(data.id), data);

      // Invalidate employee leave balances
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.employee(data.employee.id),
      });

      // Invalidate all leave balances queries
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.all,
      });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to update leave balance";
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook to delete leave balance
 */
export function useDeleteLeaveBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveBalanceApi.deleteLeaveBalance,
    onSuccess: (_, leaveBalanceId: string) => {
      toast.success("Leave balance removed successfully");

      // Remove the leave balance from cache
      queryClient.removeQueries({
        queryKey: leaveBalanceKeys.detail(leaveBalanceId),
      });

      // Invalidate all leave balances queries
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.all,
      });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to remove leave balance";
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook to bulk assign leave type to multiple employees
 */
export function useBulkAssignLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveBalanceApi.bulkAssignLeaveType,
    onSuccess: (result: BulkAssignmentResult) => {
      const { successful, failed } = result.summary;

      if (failed === 0) {
        toast.success(
          `Successfully assigned leave type to all ${successful} employees`
        );
      } else if (successful === 0) {
        toast.error(`Failed to assign leave type to all ${failed} employees`);
      } else {
        toast.warning(
          `Partially successful: ${successful} assigned, ${failed} failed`
        );
      }

      // Invalidate all leave balances queries to refresh data
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.all,
      });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to bulk assign leave type";
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook to update leave type assignments (add and remove employees)
 */
export function useUpdateLeaveTypeAssignments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveBalanceApi.updateLeaveTypeAssignments,
    onSuccess: (result: BulkAssignmentResult) => {
      const { successful, failed } = result.summary;

      if (failed === 0) {
        toast.success(
          `Successfully updated assignments for ${successful} employee${successful !== 1 ? "s" : ""}`
        );
      } else if (successful === 0) {
        toast.error(`Failed to update assignments for all ${failed} employees`);
      } else {
        toast.warning(
          `Partially successful: ${successful} updated, ${failed} failed`
        );
      }

      // Invalidate all leave balances queries to refresh data
      queryClient.invalidateQueries({
        queryKey: leaveBalanceKeys.all,
      });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to update leave type assignments";
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook to get leave balance summary for an employee
 */
export function useLeaveBalanceSummary(
  employeeId: string,
  year?: number,
  options?: {
    enabled?: boolean;
  }
) {
  const params = year ? { year } : undefined;

  const query = useEmployeeLeaveBalances(employeeId, params, options);

  // Transform the data to a summary format
  const summary = query.data?.leaveBalances?.map(balance => ({
    leaveTypeId: balance.leaveType.id,
    leaveTypeName: balance.leaveType.name,
    year: balance.year,
    totalDays: balance.totalDays,
    usedDays: balance.usedDays,
    availableDays: balance.availableDays,
    carriedOver: balance.carriedOver,
    pendingDays: 0, // This would need to be calculated from pending leave requests
  }));

  return {
    ...query,
    data: summary,
  };
}

/**
 * Hook to get employees assigned to a leave type
 */
export function useEmployeesAssignedToLeaveType(
  leaveTypeId: string,
  year?: number,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: leaveBalanceKeys.assignedToLeaveType(leaveTypeId, year),
    queryFn: () =>
      leaveBalanceApi.getEmployeesAssignedToLeaveType(leaveTypeId, year),
    enabled: options?.enabled !== false && !!leaveTypeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
