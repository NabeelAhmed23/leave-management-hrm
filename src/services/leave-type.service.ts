import { apiClient } from "@/lib/axios";
import {
  CreateLeaveTypeDTO,
  UpdateLeaveTypeDTO,
  QueryLeaveTypesDTO,
  LeaveTypeResponse,
  LeaveTypesResponse,
  DetailedLeaveType,
} from "@/types/leave-type.types";

/**
 * Get all leave types for the organization
 */
export async function getLeaveTypes(
  query: QueryLeaveTypesDTO = { page: 1, limit: 10 }
): Promise<LeaveTypesResponse["data"]> {
  const params = new URLSearchParams();

  if (query.search) params.append("search", query.search);
  if (query.page) params.append("page", query.page.toString());
  if (query.limit) params.append("limit", query.limit.toString());

  const response = await apiClient.get<LeaveTypesResponse>(
    `/leave-types?${params.toString()}`
  );

  return response.data.data;
}

/**
 * Get a single leave type by ID
 */
export async function getLeaveType(id: string): Promise<DetailedLeaveType> {
  const response = await apiClient.get<LeaveTypeResponse>(`/leave-types/${id}`);
  return response.data.data;
}

/**
 * Create a new leave type
 */
export async function createLeaveType(
  data: CreateLeaveTypeDTO
): Promise<DetailedLeaveType> {
  const response = await apiClient.post<LeaveTypeResponse>(
    "/leave-types",
    data
  );
  return response.data.data;
}

/**
 * Update an existing leave type
 */
export async function updateLeaveType(
  id: string,
  data: UpdateLeaveTypeDTO
): Promise<DetailedLeaveType> {
  const response = await apiClient.patch<LeaveTypeResponse>(
    `/leave-types/${id}`,
    data
  );
  return response.data.data;
}

/**
 * Delete a leave type
 */
export async function deleteLeaveType(
  id: string
): Promise<{ message: string }> {
  const response = await apiClient.delete<{
    success: boolean;
    message: string;
  }>(`/leave-types/${id}`);
  return { message: response.data.message };
}

/**
 * Get simple leave types for dropdowns
 */
export async function getSimpleLeaveTypes(): Promise<
  Array<{ id: string; name: string; maxDaysPerYear: number }>
> {
  const response = await apiClient.get<{
    success: boolean;
    message: string;
    data: Array<{ id: string; name: string; maxDaysPerYear: number }>;
  }>("/leave-types/simple");
  return response.data.data;
}
