// Application constants
export const APP_NAME = "Leave Management System";
export const APP_DESCRIPTION = "Modern HR Leave Management Solution";

// API endpoints
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    PROFILE: "/api/auth/profile",
  },
  USERS: "/api/users",
  ORGANIZATIONS: "/api/organizations",
  LEAVE_REQUESTS: "/api/leave-requests",
  LEAVE_TYPES: "/api/leave-types",
  DASHBOARD: "/api/dashboard",
} as const;

// Application routes
export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  DASHBOARD: "/dashboard",
  LEAVE_REQUESTS: "/leave-requests",
  CALENDAR: "/calendar",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  ADMIN: "/admin",
} as const;

// User roles with permissions
export const USER_ROLES = {
  EMPLOYEE: {
    value: "EMPLOYEE",
    label: "Employee",
    permissions: ["VIEW_OWN_REQUESTS", "CREATE_LEAVE_REQUEST"],
  },
  MANAGER: {
    value: "MANAGER",
    label: "Manager",
    permissions: [
      "VIEW_OWN_REQUESTS",
      "CREATE_LEAVE_REQUEST",
      "APPROVE_REQUESTS",
      "VIEW_TEAM_REQUESTS",
    ],
  },
  HR_ADMIN: {
    value: "HR_ADMIN",
    label: "HR Admin",
    permissions: [
      "VIEW_ALL_REQUESTS",
      "APPROVE_REQUESTS",
      "MANAGE_LEAVE_TYPES",
      "VIEW_REPORTS",
      "MANAGE_USERS",
    ],
  },
  SUPER_ADMIN: {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    permissions: [
      "FULL_ACCESS",
      "MANAGE_ORGANIZATIONS",
      "MANAGE_SYSTEM_SETTINGS",
    ],
  },
} as const;

// Leave status with colors and labels
export const LEAVE_STATUS = {
  PENDING: {
    value: "PENDING",
    label: "Pending",
    color: "yellow",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
  },
  APPROVED: {
    value: "APPROVED",
    label: "Approved",
    color: "green",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
  },
  REJECTED: {
    value: "REJECTED",
    label: "Rejected",
    color: "red",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
  },
  CANCELLED: {
    value: "CANCELLED",
    label: "Cancelled",
    color: "gray",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
  },
} as const;

// Common leave types (can be customized per organization)
export const DEFAULT_LEAVE_TYPES = [
  {
    name: "Annual Leave",
    description: "Yearly vacation days",
    maxDaysPerYear: 25,
    carryOverDays: 5,
  },
  {
    name: "Sick Leave",
    description: "Medical leave for illness",
    maxDaysPerYear: 10,
    carryOverDays: 0,
  },
  {
    name: "Personal Leave",
    description: "Personal time off",
    maxDaysPerYear: 5,
    carryOverDays: 0,
  },
  {
    name: "Maternity Leave",
    description: "Maternity leave",
    maxDaysPerYear: 90,
    carryOverDays: 0,
  },
  {
    name: "Paternity Leave",
    description: "Paternity leave",
    maxDaysPerYear: 14,
    carryOverDays: 0,
  },
] as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  INPUT: "yyyy-MM-dd",
  FULL: "MMMM dd, yyyy",
  SHORT: "MM/dd/yyyy",
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Toast messages
export const MESSAGES = {
  SUCCESS: {
    LEAVE_REQUEST_CREATED: "Leave request submitted successfully",
    LEAVE_REQUEST_UPDATED: "Leave request updated successfully",
    LEAVE_REQUEST_CANCELLED: "Leave request cancelled successfully",
    PROFILE_UPDATED: "Profile updated successfully",
    ORGANIZATION_CREATED: "Organization created successfully",
  },
  ERROR: {
    GENERIC: "Something went wrong. Please try again.",
    UNAUTHORIZED: "You are not authorized to perform this action",
    VALIDATION: "Please check your input and try again",
    NETWORK: "Network error. Please check your connection",
    NOT_FOUND: "The requested resource was not found",
  },
} as const;
