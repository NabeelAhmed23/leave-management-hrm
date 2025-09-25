import { User, Organization, LeaveType, LeaveRequest } from "@prisma/client";

// API Response types
export interface ApiResponse<T = Record<string, unknown>> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

// Extended types with relations
export interface UserWithOrganization extends User {
  organization?: Organization;
}

export interface LeaveRequestWithDetails extends LeaveRequest {
  user: Pick<User, "id" | "firstName" | "lastName" | "email">;
  leaveType: Pick<LeaveType, "id" | "name" | "description">;
  approvedBy?: Pick<User, "id" | "firstName" | "lastName" | "email">;
}

export interface OrganizationWithUsers extends Organization {
  users: User[];
  leaveTypes: LeaveType[];
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface LeaveRequestForm {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface CreateLeaveTypeForm {
  name: string;
  description?: string;
  maxDaysPerYear: number;
  carryOverDays?: number;
}

// Utility types
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export interface DateRange {
  from: Date;
  to: Date;
}

// Constants
export const ROLES = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  HR_ADMIN: "HR_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const LEAVE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
