import { QueryReportsInput } from "@/schemas/report.schema";

// Report statistics
export interface ReportStats {
  totalEmployees: number;
  totalLeaveRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalLeaveDaysTaken: number;
  averageLeaveDaysPerEmployee: number;
}

// Leave by type
export interface LeaveByType {
  leaveTypeName: string;
  leaveTypeId: string;
  totalRequests: number;
  approvedRequests: number;
  totalDays: number;
  color: string;
}

// Leave by status
export interface LeaveByStatus {
  status: string;
  count: number;
  percentage: number;
}

// Leave by month
export interface LeaveByMonth {
  month: string;
  year: number;
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  totalDays: number;
}

// Leave by department
export interface LeaveByDepartment {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  totalRequests: number;
  totalDays: number;
  averageDaysPerEmployee: number;
}

// Top employees by leave
export interface TopEmployeeByLeave {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentName: string | null;
  totalRequests: number;
  totalDays: number;
  leaveTypes: string[];
}

// Comprehensive report data
export interface ReportData {
  stats: ReportStats;
  leaveByType: LeaveByType[];
  leaveByStatus: LeaveByStatus[];
  leaveByMonth: LeaveByMonth[];
  leaveByDepartment: LeaveByDepartment[];
  topEmployeesByLeave: TopEmployeeByLeave[];
}

// Export data for Excel
export interface ExportData {
  summary: Record<string, string | number>[];
  leaveByType: Record<string, string | number>[];
  leaveByDepartment: Record<string, string | number>[];
  leaveByMonth: Record<string, string | number>[];
  topEmployees: Record<string, string | number>[];
}

// Query DTO
export type QueryReportsDTO = QueryReportsInput;

// API Response
export interface ReportResponse {
  success: boolean;
  message: string;
  data?: ReportData;
  error?: string;
}
