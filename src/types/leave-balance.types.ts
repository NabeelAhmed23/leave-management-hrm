import {
  AssignLeaveTypeInput,
  UpdateLeaveBalanceInput,
  BulkAssignLeaveTypeInput,
  QueryLeaveBalancesInput,
} from "@/schemas/leave-balance.schema";

// Base leave balance interface
export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  availableDays: number;
  carriedOver: number;
  createdAt: Date;
  updatedAt: Date;
}

// Leave balance with employee information
export interface LeaveBalanceWithEmployee extends LeaveBalance {
  employee: {
    id: string;
    employeeNumber: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    department?: {
      id: string;
      name: string;
    };
  };
}

// Leave balance with leave type information
export interface LeaveBalanceWithLeaveType extends LeaveBalance {
  leaveType: {
    id: string;
    name: string;
    description?: string | null;
    maxDaysPerYear: number;
  };
}

// Detailed leave balance with all relationships
export interface DetailedLeaveBalance extends LeaveBalance {
  employee: {
    id: string;
    employeeNumber: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    department?: {
      id: string;
      name: string;
    };
  };
  leaveType: {
    id: string;
    name: string;
    description?: string | null;
    maxDaysPerYear: number;
    organization: {
      id: string;
      name: string;
      domain: string;
    };
  };
}

// Employee with leave balances
export interface EmployeeWithLeaveBalances {
  id: string;
  employeeNumber: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  department?: {
    id: string;
    name: string;
  };
  leaveBalances: LeaveBalanceWithLeaveType[];
}

// Leave balance summary for dashboard
export interface LeaveBalanceSummary {
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  totalDays: number;
  usedDays: number;
  availableDays: number;
  carriedOver: number;
  pendingDays: number; // Days in pending requests
}

// Bulk assignment result
export interface BulkAssignmentResult {
  successful: Array<{
    employeeId: string;
    employeeName: string;
    leaveBalanceId: string;
  }>;
  failed: Array<{
    employeeId: string;
    employeeName: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// DTOs for API communication
export type CreateLeaveBalanceDTO = AssignLeaveTypeInput;
export type UpdateLeaveBalanceDTO = UpdateLeaveBalanceInput;
export type BulkAssignLeaveTypeDTO = BulkAssignLeaveTypeInput;
export type QueryLeaveBalancesDTO = QueryLeaveBalancesInput;

// API response types
export interface LeaveBalanceResponse {
  success: boolean;
  message: string;
  data: DetailedLeaveBalance;
}

export interface LeaveBalancesListResponse {
  success: boolean;
  message: string;
  data: {
    leaveBalances: DetailedLeaveBalance[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface BulkAssignResponse {
  success: boolean;
  message: string;
  data: BulkAssignmentResult;
}
