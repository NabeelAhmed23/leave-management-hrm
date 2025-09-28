// Import the schema types
import {
  UpdateOrganizationInput,
  OrganizationSettingsInput,
  GetOrganizationStatsInput,
} from "@/schemas/organization.schema";

// Organization settings interface
export interface OrganizationSettings {
  timezone?: string;
  workingDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  workingHours?: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  companyAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  companyPhone?: string;
  companyEmail?: string;
  logoUrl?: string;
  fiscalYearStart?: string; // MM-DD format
  currency?: string; // ISO 4217 currency code
  dateFormat?: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD" | "DD-MM-YYYY";
  timeFormat?: "12h" | "24h";
}

// Base organization interface
export interface Organization {
  id: string;
  name: string;
  domain: string;
  settings: OrganizationSettings | null;
  carryOverDays: number;
  leaveRefreshDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Detailed organization with statistics
export interface DetailedOrganization extends Organization {
  _count: {
    employees: number;
    departments: number;
    leaveTypes: number;
    leavePolicies: number;
    holidays: number;
  };
  stats?: {
    activeEmployees: number;
    inactiveEmployees: number;
    totalLeaveRequests: number;
    pendingLeaveRequests: number;
    approvedLeaveRequests: number;
    rejectedLeaveRequests: number;
  };
}

// Organization statistics interface
export interface OrganizationStats {
  employees: {
    total: number;
    active: number;
    inactive: number;
    byRole: {
      EMPLOYEE: number;
      MANAGER: number;
      HR_ADMIN: number;
      SUPER_ADMIN: number;
    };
    byDepartment: Array<{
      departmentId: string;
      departmentName: string;
      count: number;
    }>;
  };
  departments: {
    total: number;
    withManager: number;
    withoutManager: number;
  };
  leaves: {
    types: number;
    policies: number;
    requests: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      cancelled: number;
    };
    thisMonth: {
      submitted: number;
      approved: number;
      rejected: number;
    };
    thisYear: {
      submitted: number;
      approved: number;
      rejected: number;
      totalDaysTaken: number;
    };
  };
  holidays: {
    total: number;
    thisYear: number;
    recurring: number;
  };
}

// DTOs for API requests
export type UpdateOrganizationDTO = UpdateOrganizationInput;
export type GetOrganizationStatsDTO = GetOrganizationStatsInput;

// API Response interfaces
export interface OrganizationResponse {
  success: boolean;
  message: string;
  data: DetailedOrganization;
}

export interface OrganizationStatsResponse {
  success: boolean;
  message: string;
  data: OrganizationStats;
}

// Organization activity log interface
export interface OrganizationActivity {
  id: string;
  action: "CREATED" | "UPDATED" | "SETTINGS_CHANGED";
  field?: string;
  oldValue?: string;
  newValue?: string;
  performedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Organization validation result
export interface OrganizationValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

// Organization setup progress interface
export interface OrganizationSetupProgress {
  completedSteps: number;
  totalSteps: number;
  percentage: number;
  steps: Array<{
    id: string;
    name: string;
    description: string;
    isCompleted: boolean;
    isOptional: boolean;
  }>;
}
