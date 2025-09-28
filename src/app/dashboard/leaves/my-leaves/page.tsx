"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeaveFilters } from "@/components/leaves/leave-filters";
import { LeaveRequestTable } from "@/components/leaves/leave-request-table";
import { Plus } from "lucide-react";
import Link from "next/link";
import {
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  LeaveFilters as LeaveFiltersType,
  PaginationInfo,
} from "@/types/leave";

// Mock data for demonstration
const mockLeaveTypes: LeaveType[] = [
  {
    id: "1",
    name: "Annual Leave",
    description: "Yearly vacation days",
    maxDaysPerYear: 25,
    color: "#3B82F6",
  },
  {
    id: "2",
    name: "Sick Leave",
    description: "Medical leave",
    maxDaysPerYear: 10,
    color: "#EF4444",
  },
  {
    id: "3",
    name: "Personal Leave",
    description: "Personal time off",
    maxDaysPerYear: 5,
    color: "#8B5CF6",
  },
  {
    id: "4",
    name: "Maternity Leave",
    description: "Maternity leave",
    maxDaysPerYear: 120,
    color: "#EC4899",
  },
];

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "req_001",
    employeeId: "emp_001",
    employeeName: "John Doe",
    leaveTypeId: "1",
    leaveType: mockLeaveTypes[0],
    startDate: "2024-12-15",
    endDate: "2024-12-25",
    totalDays: 8,
    reason: "Christmas vacation with family",
    status: LeaveStatus.APPROVED,
    approvedBy: "Jane Smith",
    approvedAt: "2024-12-01T10:00:00Z",
    createdAt: "2024-11-28T09:00:00Z",
    updatedAt: "2024-12-01T10:00:00Z",
  },
  {
    id: "req_002",
    employeeId: "emp_001",
    employeeName: "John Doe",
    leaveTypeId: "2",
    leaveType: mockLeaveTypes[1],
    startDate: "2024-11-20",
    endDate: "2024-11-22",
    totalDays: 3,
    reason: "Flu symptoms",
    status: LeaveStatus.PENDING,
    createdAt: "2024-11-19T14:30:00Z",
    updatedAt: "2024-11-19T14:30:00Z",
  },
  {
    id: "req_003",
    employeeId: "emp_001",
    employeeName: "John Doe",
    leaveTypeId: "1",
    leaveType: mockLeaveTypes[0],
    startDate: "2024-10-10",
    endDate: "2024-10-12",
    totalDays: 3,
    reason: "Long weekend trip",
    status: LeaveStatus.REJECTED,
    rejectedBy: "Jane Smith",
    rejectedAt: "2024-10-08T16:00:00Z",
    createdAt: "2024-10-05T11:00:00Z",
    updatedAt: "2024-10-08T16:00:00Z",
  },
  {
    id: "req_004",
    employeeId: "emp_001",
    employeeName: "John Doe",
    leaveTypeId: "3",
    leaveType: mockLeaveTypes[2],
    startDate: "2024-09-25",
    endDate: "2024-09-25",
    totalDays: 1,
    reason: "Personal appointment",
    status: LeaveStatus.CANCELLED,
    createdAt: "2024-09-20T08:00:00Z",
    updatedAt: "2024-09-24T12:00:00Z",
  },
  {
    id: "req_005",
    employeeId: "emp_001",
    employeeName: "John Doe",
    leaveTypeId: "1",
    leaveType: mockLeaveTypes[0],
    startDate: "2024-08-15",
    endDate: "2024-08-20",
    totalDays: 4,
    reason: "Summer vacation",
    status: LeaveStatus.APPROVED,
    approvedBy: "Jane Smith",
    approvedAt: "2024-08-10T14:00:00Z",
    createdAt: "2024-08-05T10:00:00Z",
    updatedAt: "2024-08-10T14:00:00Z",
  },
];

export default function MyLeavesPage(): React.ReactElement {
  const [filters, setFilters] = useState<LeaveFiltersType>({
    status: "ALL",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredData = useMemo(() => {
    let filtered = mockLeaveRequests;

    if (filters.status && filters.status !== "ALL") {
      filtered = filtered.filter(request => request.status === filters.status);
    }

    if (filters.leaveTypeId) {
      filtered = filtered.filter(
        request => request.leaveTypeId === filters.leaveTypeId
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(
        request => request.startDate >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(
        request => request.endDate <= filters.endDate!
      );
    }

    return filtered;
  }, [filters]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage]);

  const pagination: PaginationInfo = {
    page: currentPage,
    pageSize,
    total: filteredData.length,
    totalPages: Math.ceil(filteredData.length / pageSize),
  };

  const handleView = (request: LeaveRequest): void => {
    // TODO: Implement view functionality
    alert(`Viewing request ${request.id}`);
  };

  const handleEdit = (request: LeaveRequest): void => {
    // TODO: Navigate to edit page
    alert(`Editing request ${request.id}`);
  };

  const handleCancel = (request: LeaveRequest): void => {
    // TODO: Implement cancel functionality
    if (window.confirm("Are you sure you want to cancel this request?")) {
      alert(`Cancelled request ${request.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Leave Requests
          </h1>
          <p className="text-gray-600">
            View and manage your leave requests. Track status and plan your time
            off.
          </p>
        </div>
        <Link href="/dashboard/leaves/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Leave Request
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Requests
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {mockLeaveRequests.length}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <div className="h-4 w-4 rounded-full bg-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {
                  mockLeaveRequests.filter(
                    r => r.status === LeaveStatus.PENDING
                  ).length
                }
              </p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <div className="h-4 w-4 rounded-full bg-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {
                  mockLeaveRequests.filter(
                    r => r.status === LeaveStatus.APPROVED
                  ).length
                }
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <div className="h-4 w-4 rounded-full bg-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Days Used</p>
              <p className="text-2xl font-bold text-purple-600">
                {mockLeaveRequests
                  .filter(r => r.status === LeaveStatus.APPROVED)
                  .reduce((sum, r) => sum + r.totalDays, 0)}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <div className="h-4 w-4 rounded-full bg-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <LeaveFilters
        filters={filters}
        onFiltersChange={setFilters}
        leaveTypes={mockLeaveTypes}
      />

      {/* Table */}
      <LeaveRequestTable
        data={paginatedData}
        pagination={pagination}
        onPageChange={setCurrentPage}
        onView={handleView}
        onEdit={handleEdit}
        onCancel={handleCancel}
      />
    </div>
  );
}
