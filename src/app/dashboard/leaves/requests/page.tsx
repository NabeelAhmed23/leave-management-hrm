"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingLeaveRequestTable } from "@/components/leaves/pending-leave-request-table";
import { LeaveActionDialog } from "@/components/leaves/leave-action-dialog";
import { LeaveFilters } from "@/components/leaves/leave-filters";
import {
  usePendingLeaveRequests,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from "@/services/api/leave.api";
import { useSimpleLeaveTypes } from "@/hooks/use-leave-types";
import { QueryLeavesDTO, DetailedLeaveRequest } from "@/types/leave.types";
import { toast } from "sonner";
import { XCircle } from "lucide-react";

type ActionType = "approve" | "reject" | null;

export default function LeaveRequestsPage(): React.ReactElement {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [filters, setFilters] = useState<QueryLeavesDTO>({
    page: 1,
    limit: 10,
  });

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: ActionType;
    request: DetailedLeaveRequest | null;
  }>({
    open: false,
    action: null,
    request: null,
  });

  // Check authorization - block EMPLOYEE role
  useEffect(() => {
    if (!isLoading && user) {
      const userRole = user.employee?.role;
      if (!userRole || userRole === "EMPLOYEE") {
        router.replace("/dashboard");
        return;
      }
    }
  }, [user, isLoading, router]);

  // Fetch pending leave requests
  const {
    data: leaveData,
    isLoading: leaveRequestsLoading,
    error: leaveRequestsError,
    refetch: refetchLeaveRequests,
  } = usePendingLeaveRequests(filters);

  // Fetch leave types for filtering
  const { data: leaveTypes = [], isLoading: leaveTypesLoading } =
    useSimpleLeaveTypes();

  // Mutations
  const approveLeaveRequestMutation = useApproveLeaveRequest();
  const rejectLeaveRequestMutation = useRejectLeaveRequest();

  const leaveRequests = leaveData?.leaveRequests || [];
  const pagination = leaveData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };

  const handleApprove = (request: DetailedLeaveRequest): void => {
    setActionDialog({
      open: true,
      action: "approve",
      request,
    });
  };

  const handleReject = (request: DetailedLeaveRequest): void => {
    setActionDialog({
      open: true,
      action: "reject",
      request,
    });
  };

  const handleConfirmAction = (comment?: string): void => {
    if (!actionDialog.request) return;

    const mutation =
      actionDialog.action === "approve"
        ? approveLeaveRequestMutation
        : rejectLeaveRequestMutation;

    mutation.mutate(
      {
        id: actionDialog.request.id,
        comment: comment || "",
      },
      {
        onSuccess: () => {
          toast.success(
            `Leave request ${actionDialog.action === "approve" ? "approved" : "rejected"} successfully`
          );
          refetchLeaveRequests();
          setActionDialog({ open: false, action: null, request: null });
        },
        onError: error => {
          toast.error(
            error.message || `Failed to ${actionDialog.action} leave request`
          );
        },
      }
    );
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
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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

  const userRole = user?.employee?.role;
  if (!userRole || userRole === "EMPLOYEE") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-center text-gray-600">
          You don&apos;t have permission to access this page. Only Managers and
          HR Administrators can review leave requests.
        </p>
      </div>
    );
  }

  if (leaveRequestsError) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Leave Requests Review
          </h1>
          <p className="text-gray-600">
            Review and manage pending leave requests from your team
          </p>
        </div>

        {/* Error Card */}
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-center space-x-2 text-red-800">
            <XCircle className="h-5 w-5" />
            <h3 className="font-medium">Failed to load leave requests</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">
            {leaveRequestsError.message ||
              "Unable to fetch leave requests. Please try again."}
          </p>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalPending = pagination.total;
  const todayApproved = 0; // This would need to be calculated from another API call if needed
  const todayRejected = 0; // This would need to be calculated from another API call if needed

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Leave Requests Review
        </h1>
        <p className="text-gray-600">
          Review and manage pending leave requests from your team
        </p>
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
      <PendingLeaveRequestTable
        data={leaveRequests}
        pagination={pagination}
        onPageChange={handlePageChange}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={leaveRequestsLoading}
      />

      {/* Action Dialog */}
      <LeaveActionDialog
        open={actionDialog.open}
        onOpenChange={open => setActionDialog(prev => ({ ...prev, open }))}
        action={actionDialog.action || "approve"}
        leaveRequest={actionDialog.request}
        onConfirm={handleConfirmAction}
        isLoading={
          approveLeaveRequestMutation.isPending ||
          rejectLeaveRequestMutation.isPending
        }
      />
    </div>
  );
}
