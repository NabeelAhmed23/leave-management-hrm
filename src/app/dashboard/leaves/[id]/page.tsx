"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { LeaveDetailView } from "@/components/leaves/leave-detail-view";
import { LeaveActionDialog } from "@/components/leaves/leave-action-dialog";
import {
  useLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from "@/services/api/leave.api";
import { useAuth } from "@/components/auth/auth-provider";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { LeaveStatus } from "@prisma/client";

type ActionType = "approve" | "reject" | null;

export default function LeaveDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const leaveId = params.id as string;

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: ActionType;
  }>({
    open: false,
    action: null,
  });

  // Fetch leave request
  const {
    data: leaveRequest,
    isLoading,
    error,
    refetch,
  } = useLeaveRequest(leaveId);

  // Mutations
  const approveLeaveRequestMutation = useApproveLeaveRequest();
  const rejectLeaveRequestMutation = useRejectLeaveRequest();

  const handleApprove = (): void => {
    setActionDialog({
      open: true,
      action: "approve",
    });
  };

  const handleReject = (): void => {
    setActionDialog({
      open: true,
      action: "reject",
    });
  };

  const handleConfirmAction = (comment?: string): void => {
    if (!leaveRequest) return;

    const mutation =
      actionDialog.action === "approve"
        ? approveLeaveRequestMutation
        : rejectLeaveRequestMutation;

    mutation.mutate(
      {
        id: leaveRequest.id,
        comment: comment || "",
      },
      {
        onSuccess: () => {
          toast.success(
            `Leave request ${actionDialog.action === "approve" ? "approved" : "rejected"} successfully`
          );
          refetch();
          setActionDialog({ open: false, action: null });
        },
        onError: error => {
          toast.error(
            error.message || `Failed to ${actionDialog.action} leave request`
          );
        },
      }
    );
  };

  const handleBack = (): void => {
    router.back();
  };

  // Check if user can approve/reject
  const userRole = user?.employee?.role;
  const canApproveReject = userRole === "MANAGER" || userRole === "HR_ADMIN";
  const isPending = leaveRequest?.status === LeaveStatus.PENDING;
  const showActions = canApproveReject && isPending;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Content Skeletons */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="mb-4 h-6 w-48" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error || !leaveRequest) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Error Card */}
        <Card className="border-red-200 bg-red-50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-red-900">
            Failed to load leave request
          </h3>
          <p className="mb-4 text-red-700">
            {error?.message ||
              "Unable to fetch leave request details. Please try again."}
          </p>
          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={handleBack}>
              Go Back
            </Button>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleReject}
              disabled={
                approveLeaveRequestMutation.isPending ||
                rejectLeaveRequestMutation.isPending
              }
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={
                approveLeaveRequestMutation.isPending ||
                rejectLeaveRequestMutation.isPending
              }
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* Leave Details */}
      <LeaveDetailView leaveRequest={leaveRequest} />

      {/* Action Dialog */}
      <LeaveActionDialog
        open={actionDialog.open}
        onOpenChange={open => setActionDialog(prev => ({ ...prev, open }))}
        action={actionDialog.action || "approve"}
        leaveRequest={leaveRequest}
        onConfirm={handleConfirmAction}
        isLoading={
          approveLeaveRequestMutation.isPending ||
          rejectLeaveRequestMutation.isPending
        }
      />
    </div>
  );
}
