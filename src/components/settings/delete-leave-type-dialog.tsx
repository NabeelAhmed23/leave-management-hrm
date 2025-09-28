"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { useDeleteLeaveType } from "@/hooks/use-leave-types";
import { DetailedLeaveType } from "@/types/leave-type.types";
import { AppError } from "@/utils/app-error";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface DeleteLeaveTypeDialogProps {
  leaveType: DetailedLeaveType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteLeaveTypeDialog({
  leaveType,
  open,
  onOpenChange,
}: DeleteLeaveTypeDialogProps): React.ReactElement {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteLeaveTypeMutation = useDeleteLeaveType();

  const hasUsage =
    leaveType._count &&
    ((leaveType._count.leaveRequests ?? 0) > 0 ||
      (leaveType._count.leaveBalances ?? 0) > 0 ||
      (leaveType._count.leavePolicies ?? 0) > 0);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteLeaveTypeMutation.mutateAsync(leaveType.id);
      toast.success("Leave type deleted successfully");
      onOpenChange(false);
    } catch (error) {
      const appError = error as AppError;
      toast.error(appError.message || "Failed to delete leave type");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            Delete Leave Type
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete the following leave type?
          </p>

          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{leaveType.name}</h4>
              <Badge variant="secondary">
                {leaveType.maxDaysPerYear} days/year
              </Badge>
            </div>
            {leaveType.description && (
              <p className="text-muted-foreground text-sm">
                {leaveType.description}
              </p>
            )}
          </div>

          {hasUsage ? (
            <div className="bg-destructive/10 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="text-destructive h-5 w-5" />
                <div className="ml-3">
                  <h3 className="text-destructive text-sm font-medium">
                    Cannot delete leave type
                  </h3>
                  <div className="text-destructive mt-2 text-sm">
                    <p className="mb-2">
                      This leave type is currently in use and cannot be deleted:
                    </p>
                    <ul className="list-inside list-disc space-y-1">
                      {(leaveType._count?.leaveRequests ?? 0) > 0 && (
                        <li>
                          {leaveType._count?.leaveRequests} leave requests
                        </li>
                      )}
                      {(leaveType._count?.leaveBalances ?? 0) > 0 && (
                        <li>
                          {leaveType._count?.leaveBalances} leave balances
                        </li>
                      )}
                      {(leaveType._count?.leavePolicies ?? 0) > 0 && (
                        <li>
                          {leaveType._count?.leavePolicies} leave policies
                        </li>
                      )}
                    </ul>
                    <p className="mt-2">
                      Please remove all related data before deleting this leave
                      type.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-amber-50 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    This action cannot be undone
                  </h3>
                  <p className="mt-2 text-sm text-amber-700">
                    Deleting this leave type will permanently remove it from
                    your organization. Make sure this is what you want to do.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || hasUsage}
          >
            {isDeleting && <Spinner size="sm" className="mr-2" />}
            Delete Leave Type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
