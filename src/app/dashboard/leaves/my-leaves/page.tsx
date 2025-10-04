"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveFilters } from "@/components/leaves/leave-filters";
import { LeaveRequestTable } from "@/components/leaves/leave-request-table";
import { Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { LeaveStatus } from "@prisma/client";
import {
  useLeaveRequests,
  useCancelLeaveRequest,
} from "@/services/api/leave.api";
import { useSimpleLeaveTypes } from "@/hooks/use-leave-types";
import { QueryLeavesDTO, DetailedLeaveRequest } from "@/types/leave.types";
import { toast } from "sonner";

export default function MyLeavesPage(): React.ReactElement {
  const [filters, setFilters] = useState<QueryLeavesDTO>({
    page: 1,
    limit: 10,
  });

  // Fetch leave requests with filters
  const {
    data: leaveData,
    isLoading: leaveRequestsLoading,
    error: leaveRequestsError,
    refetch: refetchLeaveRequests,
  } = useLeaveRequests(filters);

  // Fetch leave types for filtering
  const { data: leaveTypes = [], isLoading: leaveTypesLoading } =
    useSimpleLeaveTypes();

  // Cancel leave request mutation
  const cancelLeaveRequestMutation = useCancelLeaveRequest();

  const leaveRequests = leaveData?.leaveRequests || [];
  const pagination = leaveData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };

  const handleEdit = (request: DetailedLeaveRequest): void => {
    // TODO: Navigate to edit page
    alert(`Editing request ${request.id}`);
  };

  const handleCancel = (request: DetailedLeaveRequest): void => {
    if (window.confirm("Are you sure you want to cancel this request?")) {
      cancelLeaveRequestMutation.mutate(
        { id: request.id, data: {} },
        {
          onSuccess: () => {
            toast.success("Leave request cancelled successfully");
            refetchLeaveRequests();
          },
          onError: error => {
            toast.error(error.message || "Failed to cancel leave request");
          },
        }
      );
    }
  };

  const handlePageChange = (page: number): void => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFiltersChange = (newFilters: Partial<typeof filters>): void => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Loading state
  if (leaveRequestsLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <Skeleton className="mb-2 h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card className="p-6">
          <Skeleton className="h-32 w-full" />
        </Card>

        {/* Table Skeleton */}
        <Card className="p-6">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  // Error state
  if (leaveRequestsError) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Leave Requests
            </h1>
            <p className="text-gray-600">
              View and manage your leave requests. Track status and plan your
              time off.
            </p>
          </div>
          <Link href="/dashboard/leaves/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Leave Request
            </Button>
          </Link>
        </div>

        {/* Error Card */}
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Failed to load leave requests</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">
            {leaveRequestsError.message ||
              "Unable to fetch leave requests. Please try again."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => refetchLeaveRequests()}
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

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
                {pagination.total}
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
                  leaveRequests.filter(r => r.status === LeaveStatus.PENDING)
                    .length
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
                  leaveRequests.filter(r => r.status === LeaveStatus.APPROVED)
                    .length
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
                {leaveRequests
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
      {!leaveTypesLoading && (
        <LeaveFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          leaveTypes={leaveTypes}
        />
      )}

      {/* Table */}
      <LeaveRequestTable
        data={leaveRequests}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onCancel={handleCancel}
        isLoading={cancelLeaveRequestMutation.isPending}
      />
    </div>
  );
}
