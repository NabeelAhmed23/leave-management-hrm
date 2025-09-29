import { LeaveStatus, Role } from "@prisma/client";
import { CheckLeaveBalanceInput } from "@/schemas/leave.schema";

// Base leave request interface
export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
  status: LeaveStatus;
  approvedById?: string;
  approvedAt?: Date;
  rejectedById?: string;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Employee information for leave requests
export interface LeaveRequestEmployee {
  id: string;
  employeeNumber: string;
  role: Role;
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
}

// Leave type information
export interface LeaveType {
  id: string;
  name: string;
  description?: string | null;
  maxDaysPerYear: number;
}

// Leave balance information
export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  availableDays: number;
  carriedOver: number;
}

// Leave comment interface
export interface LeaveComment {
  id: string;
  content: string;
  employeeId: string;
  employee: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  isInternal: boolean;
  createdAt: Date;
}

// Detailed leave request with relationships
export interface DetailedLeaveRequest extends LeaveRequest {
  employee: LeaveRequestEmployee;
  leaveType: LeaveType;
  approvedBy?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  rejectedBy?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  leaveComments: LeaveComment[];
}

// API Response DTOs
export interface LeaveRequestResponse {
  success: boolean;
  message: string;
  data?: DetailedLeaveRequest;
  error?: string;
}

export interface LeaveRequestsResponse {
  success: boolean;
  message: string;
  data?: {
    leaveRequests: DetailedLeaveRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  error?: string;
}

export interface LeaveBalanceResponse {
  success: boolean;
  message: string;
  data?: LeaveBalance[];
  error?: string;
}

export interface LeaveTypesResponse {
  success: boolean;
  message: string;
  data?: LeaveType[];
  error?: string;
}

// API Input DTOs
export interface CreateLeaveRequestDTO {
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface UpdateLeaveRequestDTO {
  leaveTypeId?: string;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
}

export interface QueryLeavesDTO {
  status?: LeaveStatus;
  leaveTypeId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface ApproveLeaveDTO {
  comment?: string;
}

export interface RejectLeaveDTO {
  comment: string;
}

export interface CancelLeaveDTO {
  reason?: string;
}

export type CheckLeaveBalanceDTO = CheckLeaveBalanceInput;

// Leave balance check result interface
export interface LeaveBalanceCheckResult {
  leaveType: {
    id: string;
    name: string;
    maxDaysPerYear: number;
  };
  currentBalance: {
    totalDays: number;
    usedDays: number;
    availableDays: number;
    carriedOver: number;
    year: number;
  } | null;
  requestedDays: number;
  isAllowed: boolean;
  conflicts: Array<{
    type:
      | "insufficient_balance"
      | "overlapping_leave"
      | "invalid_dates"
      | "no_balance_record"
      | "weekend_only";
    message: string;
    details?: Record<string, unknown>;
  }>;
  overlappingLeaves: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    status: LeaveStatus;
    leaveType: {
      name: string;
    };
  }>;
}

// API Response for balance check
export interface LeaveBalanceCheckResponse {
  success: boolean;
  message: string;
  data: LeaveBalanceCheckResult;
}

// Utility types
export type LeaveRequestStatus = LeaveStatus;
export type LeaveRequestAction = "approve" | "reject" | "cancel";

// Leave statistics interface
export interface LeaveStatistics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  totalDaysRequested: number;
  totalDaysApproved: number;
}

// Calendar event interface for leave display
export interface LeaveCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: LeaveStatus;
  employeeName: string;
  leaveType: string;
  color: string;
}
