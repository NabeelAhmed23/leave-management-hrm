"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLeaveTypes,
  getLeaveType,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getSimpleLeaveTypes,
} from "@/services/leave-type.service";
import {
  CreateLeaveTypeDTO,
  UpdateLeaveTypeDTO,
  QueryLeaveTypesDTO,
} from "@/types/leave-type.types";
import { AppError } from "@/utils/app-error";

// Query keys
export const leaveTypeKeys = {
  all: ["leave-types"] as const,
  lists: () => [...leaveTypeKeys.all, "list"] as const,
  list: (query: QueryLeaveTypesDTO) =>
    [...leaveTypeKeys.lists(), query] as const,
  details: () => [...leaveTypeKeys.all, "detail"] as const,
  detail: (id: string) => [...leaveTypeKeys.details(), id] as const,
  simple: () => [...leaveTypeKeys.all, "simple"] as const,
};

/**
 * Hook to get all leave types with pagination and search
 */
export function useLeaveTypes(query: Partial<QueryLeaveTypesDTO> = {}) {
  const queryWithDefaults: QueryLeaveTypesDTO = {
    page: 1,
    limit: 10,
    ...query,
  };

  return useQuery({
    queryKey: leaveTypeKeys.list(queryWithDefaults),
    queryFn: () => getLeaveTypes(queryWithDefaults),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get a single leave type by ID
 */
export function useLeaveType(id: string) {
  return useQuery({
    queryKey: leaveTypeKeys.detail(id),
    queryFn: () => getLeaveType(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get simple leave types for dropdowns
 */
export function useSimpleLeaveTypes() {
  return useQuery({
    queryKey: leaveTypeKeys.simple(),
    queryFn: () => getSimpleLeaveTypes(),
    staleTime: 10 * 60 * 1000, // 10 minutes (longer cache as these change less frequently)
  });
}

/**
 * Hook to create a new leave type
 */
export function useCreateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeaveTypeDTO) => createLeaveType(data),
    onSuccess: () => {
      // Invalidate and refetch leave types list and simple list
      queryClient.invalidateQueries({ queryKey: leaveTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveTypeKeys.simple() });
    },
    onError: (error: AppError) => {
      throw error;
    },
  });
}

/**
 * Hook to update an existing leave type
 */
export function useUpdateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeaveTypeDTO }) =>
      updateLeaveType(id, data),
    onSuccess: (updatedLeaveType, { id }) => {
      // Update the specific leave type in the cache
      queryClient.setQueryData(leaveTypeKeys.detail(id), updatedLeaveType);

      // Invalidate and refetch leave types list and simple list
      queryClient.invalidateQueries({ queryKey: leaveTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveTypeKeys.simple() });
    },
    onError: (error: AppError) => {
      throw error;
    },
  });
}

/**
 * Hook to delete a leave type
 */
export function useDeleteLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLeaveType(id),
    onSuccess: (_, deletedId) => {
      // Remove the specific leave type from the cache
      queryClient.removeQueries({ queryKey: leaveTypeKeys.detail(deletedId) });

      // Invalidate and refetch leave types list and simple list
      queryClient.invalidateQueries({ queryKey: leaveTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveTypeKeys.simple() });
    },
    onError: (error: AppError) => {
      throw error;
    },
  });
}
