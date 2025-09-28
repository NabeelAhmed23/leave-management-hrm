"use client";

import { useState } from "react";
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
import { useCreateLeaveType } from "@/hooks/use-leave-types";
import { createLeaveTypeSchema } from "@/schemas/leave-type.schema";
import { CreateLeaveTypeDTO } from "@/types/leave-type.types";
import { AppError } from "@/utils/app-error";
import { toast } from "sonner";

interface CreateLeaveTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLeaveTypeDialog({
  open,
  onOpenChange,
}: CreateLeaveTypeDialogProps): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createLeaveTypeMutation = useCreateLeaveType();

  const form = useForm<CreateLeaveTypeDTO>({
    resolver: zodResolver(createLeaveTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      maxDaysPerYear: 20,
    },
  });

  const onSubmit = async (data: CreateLeaveTypeDTO) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createLeaveTypeMutation.mutateAsync(data);
      toast.success("Leave type created successfully");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      const appError = error as AppError;
      toast.error(appError.message || "Failed to create leave type");
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Leave Type</DialogTitle>
        </DialogHeader>

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
                Create Leave Type
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
