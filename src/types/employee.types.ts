import {
  Employee,
  User,
  Department,
  Organization,
  LeaveBalance,
  LeaveType,
  Role,
  EmployeeInvite as PrismaEmployeeInvite,
} from "../../generated/prisma";
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  QueryEmployeesClientInput,
  InviteEmployeeInput,
  SetupPasswordInput,
} from "@/schemas/employee.schema";

// Extended Employee types with relations
export interface EmployeeWithUser extends Employee {
  user: User;
  department?: Department | null;
  organization: Organization;
  manager?: EmployeeWithUser | null;
  subordinates?: EmployeeWithUser[];
  leaveBalances?: (LeaveBalance & {
    leaveType: LeaveType;
  })[];
}

export interface EmployeeDetails extends Employee {
  user: User;
  department?:
    | (Department & {
        manager?: Employee | null;
      })
    | null;
  organization: Organization;
  manager?:
    | (Employee & {
        user: User;
      })
    | null;
  subordinates: (Employee & {
    user: User;
  })[];
  leaveBalances: (LeaveBalance & {
    leaveType: LeaveType;
  })[];
}

// Form types
export interface CreateEmployeeForm {
  // User details
  firstName: string;
  lastName: string;
  email: string;
  password: string;

  // Employee details
  employeeNumber: string;
  jobTitle?: string;
  departmentId?: string;
  managerId?: string;
  role: Role;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface UpdateEmployeePersonalForm {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateEmployeeEmploymentForm {
  employeeNumber: string;
  jobTitle?: string;
  departmentId?: string;
  managerId?: string;
  role: Role;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

// API response types
export interface EmployeesResponse {
  employees: EmployeeWithUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface EmployeeDetailsResponse {
  employee: EmployeeDetails;
}

// Filter and search types
export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  role?: Role;
  isActive?: boolean;
  managerId?: string;
}

export interface EmployeePaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: keyof Employee;
  sortOrder?: "asc" | "desc";
}

// Statistics types
export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<Role, number>;
  byDepartment: Record<string, number>;
}

// Utility types
export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export interface EmployeeOption {
  id: string;
  label: string;
  employeeNumber: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
  managerId?: string;
}

// DTOs for API requests based on schemas
export type CreateEmployeeDTO = CreateEmployeeInput;
export type UpdateEmployeeDTO = UpdateEmployeeInput;
export type QueryEmployeesDTO = QueryEmployeesClientInput;
export type InviteEmployeeDTO = InviteEmployeeInput;
export type SetupPasswordDTO = SetupPasswordInput;

// Detailed employee with all relationships
export interface DetailedEmployee extends Employee {
  user: User | null;
  organization: Organization;
  department: Department | null;
  manager: (Employee & { user: User | null }) | null;
  subordinates: (Employee & { user: User | null })[];
  invite?: PrismaEmployeeInvite | null;
  phone?: string | null;
  address?: string | null;
  _count?: {
    subordinates: number;
    leaveRequests: number;
    leaveBalances: number;
  };
}

// Employee with leave balances
export interface EmployeeWithLeaveBalances extends DetailedEmployee {
  leaveBalances: (LeaveBalance & {
    leaveType: LeaveType;
  })[];
}

// Employee invite interface
export interface EmployeeInvite {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  employeeId: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  expiresAt: Date;
  sentAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// API Response interfaces
export interface EmployeeResponse {
  success: boolean;
  message: string;
  data: DetailedEmployee;
}

export interface EmployeesListResponse {
  success: boolean;
  message: string;
  data: {
    employees: DetailedEmployee[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface EmployeeInviteResponse {
  success: boolean;
  message: string;
  data: {
    inviteId: string;
    email: string;
    expiresAt: Date;
  };
}

export interface EmployeeWithLeaveBalancesResponse {
  success: boolean;
  message: string;
  data: EmployeeWithLeaveBalances;
}

// Manager option for dropdowns
export interface ManagerOption {
  id: string;
  employeeNumber: string;
  name: string;
  department?: string;
}
