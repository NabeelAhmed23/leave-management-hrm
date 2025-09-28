export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export interface LeaveType {
  id: string;
  name: string;
  description?: string;
  maxDaysPerYear: number;
  color: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: LeaveStatus;
  approvedById?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedById?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType: LeaveType;
  year: number;
  totalDays: number;
  usedDays: number;
  availableDays: number;
  carriedOver: number;
}

export interface LeaveFilters {
  status?: LeaveStatus | "ALL";
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateLeaveRequest {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateLeaveRequest {
  id: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  status?: LeaveStatus;
}
