"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateLeaveType } from "@/hooks/use-leave-types";
import { updateLeaveTypeSchema } from "@/schemas/leave-type.schema";
import {
  UpdateLeaveTypeDTO,
  DetailedLeaveType,
} from "@/types/leave-type.types";
import { AppError } from "@/utils/app-error";
import { toast } from "sonner";

interface EditLeaveTypeDialogProps {
  leaveType: DetailedLeaveType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLeaveTypeDialog({
  leaveType,
  open,
  onOpenChange,
}: EditLeaveTypeDialogProps): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateLeaveTypeMutation = useUpdateLeaveType();

  const form = useForm<UpdateLeaveTypeDTO>({
    resolver: zodResolver(updateLeaveTypeSchema),
    defaultValues: {
      name: leaveType.name,
      description: leaveType.description || "",
      maxDaysPerYear: leaveType.maxDaysPerYear,
    },
  });

  // Reset form when leaveType changes
  useEffect(() => {
    form.reset({
      name: leaveType.name,
      description: leaveType.description || "",
      maxDaysPerYear: leaveType.maxDaysPerYear,
    });
  }, [leaveType, form]);

  const onSubmit = async (data: UpdateLeaveTypeDTO) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateLeaveTypeMutation.mutateAsync({
        id: leaveType.id,
        data,
      });
      toast.success("Leave type updated successfully");
      onOpenChange(false);
    } catch (error) {
      const appError = error as AppError;
      toast.error(appError.message || "Failed to update leave type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        form.reset();
      }
    }
  };

  const hasUsage =
    leaveType._count &&
    (leaveType._count.leaveRequests > 0 ||
      leaveType._count.leaveBalances > 0 ||
      leaveType._count.leavePolicies > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Leave Type</DialogTitle>
        </DialogHeader>

        {hasUsage && (
          <div className="rounded-md bg-amber-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Leave type is in use
                </h3>
                <p className="mt-2 text-sm text-amber-700">
                  This leave type is currently being used. Changes may affect
                  existing leave requests and balances.
                </p>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Annual Leave"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this leave type (optional)"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxDaysPerYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Days Per Year *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner size="sm" className="mr-2" />}
                Update Leave Type
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
