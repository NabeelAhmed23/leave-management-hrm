import { apiClient } from "@/lib/axios";
import {
  CreateLeaveBalanceDTO,
  UpdateLeaveBalanceDTO,
  BulkAssignLeaveTypeDTO,
  QueryLeaveBalancesDTO,
  DetailedLeaveBalance,
  EmployeeWithLeaveBalances,
  BulkAssignmentResult,
  BulkAssignResponse,
} from "@/types/leave-balance.types";

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Assign leave type to employee
 */
export async function assignLeaveTypeToEmployee(
  employeeId: string,
  data: CreateLeaveBalanceDTO
): Promise<DetailedLeaveBalance> {
  const response = await apiClient.post<ApiResponse<DetailedLeaveBalance>>(
    `/employees/${employeeId}/leave-balances`,
    data
  );
  return response.data.data;
}

/**
 * Get employee leave balances
 */
export async function getEmployeeLeaveBalances(
  employeeId: string,
  params?: QueryLeaveBalancesDTO
): Promise<EmployeeWithLeaveBalances> {
  const response = await apiClient.get<ApiResponse<EmployeeWithLeaveBalances>>(
    `/employees/${employeeId}/leave-balances`,
    {
      params,
    }
  );
  return response.data.data;
}

/**
 * Get leave balance by ID
 */
export async function getLeaveBalanceById(
  leaveBalanceId: string
): Promise<DetailedLeaveBalance> {
  const response = await apiClient.get<ApiResponse<DetailedLeaveBalance>>(
    `/leave-balances/${leaveBalanceId}`
  );
  return response.data.data;
}

/**
 * Update leave balance
 */
export async function updateLeaveBalance(
  leaveBalanceId: string,
  data: UpdateLeaveBalanceDTO
): Promise<DetailedLeaveBalance> {
  const response = await apiClient.patch<ApiResponse<DetailedLeaveBalance>>(
    `/leave-balances/${leaveBalanceId}`,
    data
  );
  return response.data.data;
}

/**
 * Delete leave balance
 */
export async function deleteLeaveBalance(
  leaveBalanceId: string
): Promise<void> {
  await apiClient.delete(`/leave-balances/${leaveBalanceId}`);
}

/**
 * Bulk assign leave type to multiple employees
 */
export async function bulkAssignLeaveType(
  data: BulkAssignLeaveTypeDTO
): Promise<BulkAssignmentResult> {
  const response = await apiClient.post<BulkAssignResponse>(
    `/leave-balances/bulk-assign`,
    data
  );
  return response.data.data;
}

// Export all functions as a single object for easier importing
export const leaveBalanceApi = {
  assignLeaveTypeToEmployee,
  getEmployeeLeaveBalances,
  getLeaveBalanceById,
  updateLeaveBalance,
  deleteLeaveBalance,
  bulkAssignLeaveType,
};
