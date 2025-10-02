"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  CreateLeaveRequestDTO,
  LeaveBalanceCheckResult,
} from "@/types/leave.types";
import {
  useCreateLeaveRequest,
  useCheckLeaveBalance,
} from "@/services/api/leave.api";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const createLeaveSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Please select a leave type"),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date({
      required_error: "End date is required",
    }),
    reason: z.string().optional(),
  })
  .refine(
    data => {
      return data.endDate >= data.startDate;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    }
  );

type CreateLeaveFormData = z.infer<typeof createLeaveSchema>;

// Simple leave type interface for the form
interface SimpleLeaveType {
  id: string;
  name: string;
  maxDaysPerYear: number;
}

interface CreateLeaveFormProps {
  leaveTypes: SimpleLeaveType[];
  onSuccess?: () => void;
}

export function CreateLeaveForm({
  leaveTypes,
  onSuccess,
}: CreateLeaveFormProps): React.ReactElement {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [balanceCheckResult, setBalanceCheckResult] =
    useState<LeaveBalanceCheckResult | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const currentCheckRef = useRef<AbortController | null>(null);

  const createLeaveRequestMutation = useCreateLeaveRequest();
  const checkBalanceMutation = useCheckLeaveBalance();

  const form = useForm<CreateLeaveFormData>({
    resolver: zodResolver(createLeaveSchema),
    defaultValues: {
      reason: "",
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const leaveTypeId = form.watch("leaveTypeId");

  const calculateDays = (): number => {
    if (!startDate || !endDate) return 0;
    return differenceInDays(endDate, startDate) + 1;
  };

  // Effect to trigger balance check when form values change
  useEffect(() => {
    // Cancel any ongoing check
    if (currentCheckRef.current) {
      currentCheckRef.current.abort();
      currentCheckRef.current = null;
      setIsCheckingBalance(false);
    }

    const timeoutId = setTimeout(async () => {
      if (leaveTypeId && startDate && endDate) {
        // Create a new AbortController for this request
        const abortController = new AbortController();
        currentCheckRef.current = abortController;

        setIsCheckingBalance(true);
        try {
          const result = await checkBalanceMutation.mutateAsync({
            leaveTypeId,
            startDate,
            endDate,
          });

          // Only update state if this request wasn't aborted
          if (!abortController.signal.aborted) {
            setBalanceCheckResult(result);
          }
        } catch {
          // Only handle error if this request wasn't aborted
          if (!abortController.signal.aborted) {
            setBalanceCheckResult(null);
            toast.error("Failed to check leave balance. Please try again.");
          }
        } finally {
          // Only update loading state if this request wasn't aborted
          if (!abortController.signal.aborted) {
            setIsCheckingBalance(false);
            currentCheckRef.current = null;
          }
        }
      } else {
        setBalanceCheckResult(null);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timeoutId);
      // Cancel any ongoing request when dependencies change
      if (currentCheckRef.current) {
        currentCheckRef.current.abort();
        currentCheckRef.current = null;
        setIsCheckingBalance(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveTypeId, startDate, endDate]);

  const getTotalDays = (): number => {
    return calculateDays();
  };

  const canSubmit = (): boolean => {
    const totalDays = getTotalDays();
    // Can submit if we have a balance check result and it's allowed
    return totalDays > 0 && balanceCheckResult?.isAllowed === true;
  };

  const handleLeaveTypeChange = (value: string): void => {
    form.setValue("leaveTypeId", value);
  };

  const handleSubmit = (data: CreateLeaveFormData): void => {
    setSubmitError(null);

    const submitData: CreateLeaveRequestDTO = {
      leaveTypeId: data.leaveTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
    };

    createLeaveRequestMutation.mutate(submitData, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
        router.push("/dashboard/leaves/my-leaves");
      },
      onError: error => {
        setSubmitError(error.message || "Failed to submit leave request");
      },
    });
  };

  const totalDays = getTotalDays();
  const isValid = canSubmit();
  const isSubmitting = createLeaveRequestMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Leave Type Selection */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-medium">Leave Type</h3>
          <FormField
            control={form.control}
            name="leaveTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Leave Type</FormLabel>
                <Select
                  onValueChange={handleLeaveTypeChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a leave type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Date Selection */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-medium">Dates</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={date =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={date =>
                          date < new Date() ||
                          date < new Date("1900-01-01") ||
                          (startDate && date < startDate)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Days Calculation */}
          {startDate && endDate && (
            <div className="mt-4 rounded-lg bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Total Days Requested:
                </span>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  {totalDays} {totalDays === 1 ? "day" : "days"}
                </Badge>
              </div>
            </div>
          )}
        </Card>

        {/* Balance Check Results */}
        {(isCheckingBalance || balanceCheckResult) && (
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Leave Balance Check</h3>
              {isCheckingBalance && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking balance...</span>
                </div>
              )}
            </div>

            {balanceCheckResult && !isCheckingBalance && (
              <>
                {/* Balance Information */}
                {balanceCheckResult.currentBalance && (
                  <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {balanceCheckResult.currentBalance.totalDays}
                      </p>
                      <p className="text-sm text-gray-500">Total Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {balanceCheckResult.currentBalance.usedDays}
                      </p>
                      <p className="text-sm text-gray-500">Used Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {balanceCheckResult.currentBalance.availableDays}
                      </p>
                      <p className="text-sm text-gray-500">Available</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {balanceCheckResult.currentBalance.carriedOver}
                      </p>
                      <p className="text-sm text-gray-500">Carried Over</p>
                    </div>
                  </div>
                )}

                {/* Request Status */}
                <div
                  className={cn(
                    "mb-4 flex items-center space-x-2 rounded-lg p-3",
                    balanceCheckResult.isAllowed
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  )}
                >
                  {balanceCheckResult.isAllowed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {balanceCheckResult.isAllowed
                      ? `✓ Request approved: You can request ${balanceCheckResult.requestedDays} ${balanceCheckResult.requestedDays === 1 ? "day" : "days"}`
                      : `✗ Request not allowed: ${balanceCheckResult.requestedDays} ${balanceCheckResult.requestedDays === 1 ? "day" : "days"} requested`}
                  </span>
                </div>

                {/* Conflicts */}
                {balanceCheckResult.conflicts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-red-800">
                      Issues found:
                    </h4>
                    {balanceCheckResult.conflicts.map((conflict, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 text-sm text-red-700"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{conflict.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Overlapping Leaves */}
                {balanceCheckResult.overlappingLeaves.length > 0 && (
                  <div className="mt-4 rounded-lg bg-amber-50 p-3">
                    <h4 className="mb-2 text-sm font-medium text-amber-800">
                      Overlapping leave requests:
                    </h4>
                    <div className="space-y-1">
                      {balanceCheckResult.overlappingLeaves.map(
                        (leave, index) => (
                          <div key={index} className="text-sm text-amber-700">
                            {leave.leaveType.name}:{" "}
                            {format(new Date(leave.startDate), "MMM dd")} -{" "}
                            {format(new Date(leave.endDate), "MMM dd, yyyy")}
                            <Badge variant="outline" className="ml-2">
                              {leave.status}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        )}

        {/* Reason */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-medium">Reason (Optional)</h3>
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Leave</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please provide a reason for your leave request..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Providing a reason helps managers understand your request
                  better.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Error Display */}
        {submitError && (
          <Card className="border-red-200 bg-red-50 p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="mt-1 text-sm text-red-700">{submitError}</p>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
