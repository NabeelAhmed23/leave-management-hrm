"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReports } from "@/services/api/report.api";
import { useSimpleLeaveTypes } from "@/hooks/use-leave-types";
import { QueryReportsDTO, ExportData } from "@/types/report.types";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Download,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
];

export default function ReportsPage(): React.ReactElement {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<QueryReportsDTO>({
    year: currentYear,
  });

  // Fetch reports
  const { data: reportData, isLoading, error, refetch } = useReports(filters);

  // Fetch leave types for filtering
  const { data: leaveTypes = [] } = useSimpleLeaveTypes();

  const handleFilterChange = (key: keyof QueryReportsDTO, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  const handleYearChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      year: parseInt(value),
    }));
  };

  const handleExportToExcel = (): void => {
    if (!reportData) return;

    try {
      const exportData: ExportData = {
        summary: [
          { Metric: "Total Employees", Value: reportData.stats.totalEmployees },
          {
            Metric: "Total Leave Requests",
            Value: reportData.stats.totalLeaveRequests,
          },
          {
            Metric: "Pending Requests",
            Value: reportData.stats.pendingRequests,
          },
          {
            Metric: "Approved Requests",
            Value: reportData.stats.approvedRequests,
          },
          {
            Metric: "Rejected Requests",
            Value: reportData.stats.rejectedRequests,
          },
          {
            Metric: "Total Leave Days Taken",
            Value: reportData.stats.totalLeaveDaysTaken,
          },
          {
            Metric: "Average Days Per Employee",
            Value: reportData.stats.averageLeaveDaysPerEmployee,
          },
        ],
        leaveByType: reportData.leaveByType.map(item => ({
          "Leave Type": item.leaveTypeName,
          "Total Requests": item.totalRequests,
          "Approved Requests": item.approvedRequests,
          "Total Days": item.totalDays,
        })),
        leaveByDepartment: reportData.leaveByDepartment.map(item => ({
          Department: item.departmentName,
          "Total Employees": item.totalEmployees,
          "Total Requests": item.totalRequests,
          "Total Days": item.totalDays,
          "Average Days Per Employee": item.averageDaysPerEmployee,
        })),
        leaveByMonth: reportData.leaveByMonth.map(item => ({
          Month: item.month,
          "Total Requests": item.totalRequests,
          Approved: item.approvedRequests,
          Rejected: item.rejectedRequests,
          Pending: item.pendingRequests,
          "Total Days": item.totalDays,
        })),
        topEmployees: reportData.topEmployeesByLeave.map(item => ({
          Employee: item.employeeName,
          "Employee Number": item.employeeNumber,
          Department: item.departmentName || "N/A",
          "Total Requests": item.totalRequests,
          "Total Days": item.totalDays,
          "Leave Types": item.leaveTypes.join(", "),
        })),
      };

      const wb = XLSX.utils.book_new();

      // Add each sheet
      const summaryWs = XLSX.utils.json_to_sheet(exportData.summary);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

      const leaveByTypeWs = XLSX.utils.json_to_sheet(exportData.leaveByType);
      XLSX.utils.book_append_sheet(wb, leaveByTypeWs, "Leave by Type");

      const leaveByDeptWs = XLSX.utils.json_to_sheet(
        exportData.leaveByDepartment
      );
      XLSX.utils.book_append_sheet(wb, leaveByDeptWs, "Leave by Department");

      const leaveByMonthWs = XLSX.utils.json_to_sheet(exportData.leaveByMonth);
      XLSX.utils.book_append_sheet(wb, leaveByMonthWs, "Leave by Month");

      const topEmployeesWs = XLSX.utils.json_to_sheet(exportData.topEmployees);
      XLSX.utils.book_append_sheet(wb, topEmployeesWs, "Top Employees");

      // Generate file name
      const fileName = `Leave_Report_${filters.year || currentYear}_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Download
      XLSX.writeFile(wb, fileName);

      toast.success("Report exported successfully");
    } catch {
      toast.error("Failed to export report");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-64 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error || !reportData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <Card className="border-red-200 bg-red-50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-red-900">
            Failed to load reports
          </h3>
          <p className="mb-4 text-red-700">
            {error?.message || "Unable to fetch report data. Please try again."}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive leave management insights and trends
          </p>
        </div>
        <Button onClick={handleExportToExcel}>
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Year
            </label>
            <Select
              value={filters.year?.toString() || currentYear.toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {[currentYear, currentYear - 1, currentYear - 2].map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Leave Type
            </label>
            <Select
              value={filters.leaveTypeId || "all"}
              onValueChange={value => handleFilterChange("leaveTypeId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All leave types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                {leaveTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Requests
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.stats.totalLeaveRequests}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Employees
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.stats.totalEmployees}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Days Taken</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.stats.totalLeaveDaysTaken}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg Days/Employee
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.stats.averageLeaveDaysPerEmployee}
              </p>
            </div>
            <div className="rounded-full bg-amber-100 p-3">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Leave by Type - Pie Chart */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Leave Distribution by Type
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data={reportData.leaveByType as any}
              dataKey="totalDays"
              nameKey="leaveTypeName"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {reportData.leaveByType.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Leave by Month - Line Chart */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Leave Trends by Month
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <LineChart data={reportData.leaveByMonth as any}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="approvedRequests"
              stroke="#10b981"
              name="Approved"
            />
            <Line
              type="monotone"
              dataKey="pendingRequests"
              stroke="#f59e0b"
              name="Pending"
            />
            <Line
              type="monotone"
              dataKey="rejectedRequests"
              stroke="#ef4444"
              name="Rejected"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Leave by Department - Bar Chart */}
      {reportData.leaveByDepartment.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Leave by Department
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <BarChart data={reportData.leaveByDepartment as any}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="departmentName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalDays" fill="#3b82f6" name="Total Days" />
              <Bar
                dataKey="averageDaysPerEmployee"
                fill="#10b981"
                name="Avg Days/Employee"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top Employees */}
      {reportData.topEmployeesByLeave.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Top Employees by Leave Usage
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">
                    Employee
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">
                    Department
                  </th>
                  <th className="pb-3 text-center text-sm font-medium text-gray-600">
                    Requests
                  </th>
                  <th className="pb-3 text-center text-sm font-medium text-gray-600">
                    Total Days
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-600">
                    Leave Types
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.topEmployeesByLeave.map(emp => (
                  <tr key={emp.employeeId} className="border-b">
                    <td className="py-3 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{emp.employeeName}</p>
                        <p className="text-gray-500">{emp.employeeNumber}</p>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      {emp.departmentName || "—"}
                    </td>
                    <td className="py-3 text-center text-sm text-gray-900">
                      {emp.totalRequests}
                    </td>
                    <td className="py-3 text-center text-sm font-medium text-blue-600">
                      {emp.totalDays}
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {emp.leaveTypes.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Leave Status Distribution */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Request Status Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <BarChart data={reportData.leaveByStatus as any}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8b5cf6" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
