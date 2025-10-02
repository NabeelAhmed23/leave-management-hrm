"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DetailedLeaveRequest } from "@/types/leave.types";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface LeaveActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "approve" | "reject";
  leaveRequest: DetailedLeaveRequest | null;
  onConfirm: (comment?: string) => void;
  isLoading: boolean;
}

export function LeaveActionDialog({
  open,
  onOpenChange,
  action,
  leaveRequest,
  onConfirm,
  isLoading,
}: LeaveActionDialogProps): React.ReactElement {
  const [comment, setComment] = useState("");

  const handleConfirm = (): void => {
    onConfirm(comment || undefined);
    setComment("");
  };

  const handleCancel = (): void => {
    setComment("");
    onOpenChange(false);
  };

  if (!leaveRequest) return <></>;

  const employee = leaveRequest.employees[0]?.employee;
  const employeeName = employee
    ? `${employee.user.firstName} ${employee.user.lastName}`
    : "Unknown Employee";
  const leaveTypeName = leaveRequest.leaveType.name;
  const startDate = format(new Date(leaveRequest.startDate), "MMM dd, yyyy");
  const endDate = format(new Date(leaveRequest.endDate), "MMM dd, yyyy");
  const totalDays = leaveRequest.totalDays;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action === "approve" ? "Approve" : "Reject"} Leave Request
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action === "approve" ? (
              <>
                Are you sure you want to approve this leave request? This action
                will update the employee&apos;s leave balance.
              </>
            ) : (
              <>
                Are you sure you want to reject this leave request? Please
                provide a reason for rejection.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Leave Request Details */}
        <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">Employee:</span>
              <p className="text-gray-900">{employeeName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Leave Type:</span>
              <p className="text-gray-900">{leaveTypeName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Start Date:</span>
              <p className="text-gray-900">{startDate}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">End Date:</span>
              <p className="text-gray-900">{endDate}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-gray-600">Total Days:</span>
              <p className="text-gray-900">
                {totalDays} {totalDays === 1 ? "day" : "days"}
              </p>
            </div>
            {leaveRequest.reason && (
              <div className="col-span-2">
                <span className="font-medium text-gray-600">Reason:</span>
                <p className="text-gray-900">{leaveRequest.reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Comment/Reason Field */}
        <div className="space-y-2">
          <Label htmlFor="comment">
            {action === "approve" ? "Comment (Optional)" : "Rejection Reason"}
            {action === "reject" && (
              <span className="ml-1 text-red-500">*</span>
            )}
          </Label>
          <Textarea
            id="comment"
            placeholder={
              action === "approve"
                ? "Add a comment (optional)..."
                : "Please provide a reason for rejection..."
            }
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="min-h-[100px]"
            disabled={isLoading}
          />
          {action === "reject" && !comment && (
            <p className="text-sm text-red-600">Rejection reason is required</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || (action === "reject" && !comment.trim())}
            className={
              action === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === "approve" ? "Approve" : "Reject"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
