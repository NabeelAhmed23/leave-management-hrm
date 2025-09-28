// Import the schema types
import {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  QueryLeaveTypesClientInput,
} from "@/schemas/leave-type.schema";

// Base leave type interface
export interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  maxDaysPerYear: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Detailed leave type with organization info
export interface DetailedLeaveType extends LeaveType {
  organization: {
    id: string;
    name: string;
    domain: string;
  };
  _count?: {
    leaveRequests: number;
    leaveBalances: number;
    leavePolicies: number;
  };
}

// DTOs for API requests
export type CreateLeaveTypeDTO = CreateLeaveTypeInput;
export type UpdateLeaveTypeDTO = UpdateLeaveTypeInput;
export type QueryLeaveTypesDTO = QueryLeaveTypesClientInput;

// API Response interfaces
export interface LeaveTypeResponse {
  success: boolean;
  message: string;
  data: DetailedLeaveType;
}

export interface LeaveTypesResponse {
  success: boolean;
  message: string;
  data: {
    leaveTypes: DetailedLeaveType[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Statistics interface for admin dashboard
export interface LeaveTypeStats {
  id: string;
  name: string;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalDaysRequested: number;
  totalDaysApproved: number;
  averageDaysPerRequest: number;
}
