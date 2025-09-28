import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import {
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  QueryEmployeesDTO,
  InviteEmployeeDTO,
  SetupPasswordDTO,
  DetailedEmployee,
  EmployeesListResponse,
  EmployeeResponse,
  EmployeeInviteResponse,
  EmployeeWithLeaveBalancesResponse,
} from "@/types/employee.types";
import { AppError } from "@/utils/app-error";

// Query keys
export const employeeQueryKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeQueryKeys.all, "list"] as const,
  list: (filters: QueryEmployeesDTO) =>
    [...employeeQueryKeys.lists(), { filters }] as const,
  details: () => [...employeeQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeQueryKeys.details(), id] as const,
  detailWithBalances: (id: string) =>
    [...employeeQueryKeys.details(), id, "balances"] as const,
};

// API functions
const employeeApi = {
  // Create employee
  createEmployee: async (
    data: CreateEmployeeDTO
  ): Promise<DetailedEmployee> => {
    const response = await apiClient.post<EmployeeResponse>("/employees", data);

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to create employee",
        500
      );
    }

    return response.data.data;
  },

  // Get employees with pagination and filtering
  getEmployees: async (
    filters: QueryEmployeesDTO
  ): Promise<EmployeesListResponse["data"]> => {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.departmentId)
      params.append("departmentId", filters.departmentId);
    if (filters.role) params.append("role", filters.role);
    if (typeof filters.isActive === "boolean")
      params.append("isActive", filters.isActive.toString());
    params.append("page", filters.page.toString());
    params.append("limit", filters.limit.toString());

    const response = await apiClient.get<EmployeesListResponse>(
      `/employees?${params.toString()}`
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to retrieve employees",
        500
      );
    }

    return response.data.data;
  },

  // Get employee by ID
  getEmployeeById: async (
    id: string,
    includeLeaveBalances = false
  ): Promise<DetailedEmployee> => {
    const params = new URLSearchParams();
    if (includeLeaveBalances) {
      params.append("includeLeaveBalances", "true");
    }

    const response = await apiClient.get<EmployeeResponse>(
      `/employees/${id}${params.toString() ? `?${params.toString()}` : ""}`
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to retrieve employee",
        500
      );
    }

    return response.data.data;
  },

  // Update employee
  updateEmployee: async (
    id: string,
    data: UpdateEmployeeDTO
  ): Promise<DetailedEmployee> => {
    const response = await apiClient.put<EmployeeResponse>(
      `/employees/${id}`,
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to update employee",
        500
      );
    }

    return response.data.data;
  },

  // Delete employee (soft delete)
  deleteEmployee: async (id: string): Promise<void> => {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/employees/${id}`);

    if (!response.data.success) {
      throw new AppError(
        response.data.message || "Failed to delete employee",
        500
      );
    }
  },

  // Send employee invite
  sendEmployeeInvite: async (
    employeeId: string,
    data: InviteEmployeeDTO
  ): Promise<EmployeeInviteResponse["data"]> => {
    const response = await apiClient.post<EmployeeInviteResponse>(
      `/employees/${employeeId}/invite`,
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to send employee invite",
        500
      );
    }

    return response.data.data;
  },

  // Setup password from invite token
  setupPassword: async (data: SetupPasswordDTO): Promise<DetailedEmployee> => {
    const response = await apiClient.post<EmployeeResponse>(
      "/employees/setup-password",
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message || "Failed to setup password",
        500
      );
    }

    return response.data.data;
  },

  // Get employee with leave balances
  getEmployeeWithLeaveBalances: async (
    id: string
  ): Promise<DetailedEmployee> => {
    const response = await apiClient.get<EmployeeWithLeaveBalancesResponse>(
      `/employees/${id}?includeLeaveBalances=true`
    );

    if (!response.data.success || !response.data.data) {
      throw new AppError(
        response.data.message ||
          "Failed to retrieve employee with leave balances",
        500
      );
    }

    return response.data.data;
  },
};

// React Query hooks

// Get employees list
export function useEmployees(filters: QueryEmployeesDTO) {
  return useQuery({
    queryKey: employeeQueryKeys.list(filters),
    queryFn: () => employeeApi.getEmployees(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get employee by ID
export function useEmployee(id: string, includeLeaveBalances = false) {
  return useQuery({
    queryKey: includeLeaveBalances
      ? employeeQueryKeys.detailWithBalances(id)
      : employeeQueryKeys.detail(id),
    queryFn: () => employeeApi.getEmployeeById(id, includeLeaveBalances),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Create employee mutation
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeeApi.createEmployee,
    onSuccess: () => {
      // Invalidate employees list queries
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.lists(),
      });
    },
  });
}

// Update employee mutation
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDTO }) =>
      employeeApi.updateEmployee(id, data),
    onSuccess: updatedEmployee => {
      // Update specific employee in cache
      queryClient.setQueryData(
        employeeQueryKeys.detail(updatedEmployee.id),
        updatedEmployee
      );

      // Invalidate employees list queries
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.lists(),
      });

      // Invalidate employee with balances if it exists
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.detailWithBalances(updatedEmployee.id),
      });
    },
  });
}

// Delete employee mutation
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeeApi.deleteEmployee,
    onSuccess: (_, deletedEmployeeId) => {
      // Remove employee from cache
      queryClient.removeQueries({
        queryKey: employeeQueryKeys.detail(deletedEmployeeId),
      });

      queryClient.removeQueries({
        queryKey: employeeQueryKeys.detailWithBalances(deletedEmployeeId),
      });

      // Invalidate employees list queries
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.lists(),
      });
    },
  });
}

// Send employee invite mutation
export function useSendEmployeeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      data,
    }: {
      employeeId: string;
      data: InviteEmployeeDTO;
    }) => employeeApi.sendEmployeeInvite(employeeId, data),
    onSuccess: (_, { employeeId }) => {
      // Invalidate employee details to refresh invite status
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.detail(employeeId),
      });

      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.detailWithBalances(employeeId),
      });
    },
  });
}

// Setup password mutation (no auth required)
export function useSetupPassword() {
  return useMutation({
    mutationFn: employeeApi.setupPassword,
  });
}

// Prefetch employee
export function usePrefetchEmployee() {
  const queryClient = useQueryClient();

  return (id: string, includeLeaveBalances = false) => {
    queryClient.prefetchQuery({
      queryKey: includeLeaveBalances
        ? employeeQueryKeys.detailWithBalances(id)
        : employeeQueryKeys.detail(id),
      queryFn: () => employeeApi.getEmployeeById(id, includeLeaveBalances),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };
}

// Optimistic update for employee
export function useOptimisticEmployeeUpdate() {
  const queryClient = useQueryClient();

  return {
    updateEmployee: (id: string, data: Partial<DetailedEmployee>) => {
      queryClient.setQueryData(
        employeeQueryKeys.detail(id),
        (old: DetailedEmployee | undefined) => {
          if (!old) return old;
          return { ...old, ...data };
        }
      );
    },
    revertEmployee: (id: string) => {
      queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.detail(id),
      });
    },
  };
}

export default employeeApi;
