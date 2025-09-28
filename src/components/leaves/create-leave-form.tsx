"use client";

import { useState } from "react";
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
import { LeaveType, LeaveBalance } from "@/types/leave";
import { CreateLeaveRequestDTO } from "@/types/leave.types";
import { useCreateLeaveRequest } from "@/services/api/leave.api";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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

interface CreateLeaveFormProps {
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  onSuccess?: () => void;
}

export function CreateLeaveForm({
  leaveTypes,
  leaveBalances,
  onSuccess,
}: CreateLeaveFormProps): React.ReactElement {
  const router = useRouter();
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createLeaveRequestMutation = useCreateLeaveRequest();

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

  const getLeaveBalance = (): LeaveBalance | null => {
    if (!leaveTypeId) return null;
    return (
      leaveBalances.find(balance => balance.leaveTypeId === leaveTypeId) || null
    );
  };

  const getTotalDays = (): number => {
    return calculateDays();
  };

  const getAvailableDays = (): number => {
    const balance = getLeaveBalance();
    return balance ? balance.availableDays : 0;
  };

  const canSubmit = (): boolean => {
    const totalDays = getTotalDays();
    const availableDays = getAvailableDays();
    return totalDays > 0 && totalDays <= availableDays;
  };

  const handleLeaveTypeChange = (value: string): void => {
    const leaveType = leaveTypes.find(type => type.id === value);
    setSelectedLeaveType(leaveType || null);
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
        setSelectedLeaveType(null);
        onSuccess?.();
        router.push("/dashboard/leaves");
      },
      onError: error => {
        setSubmitError(error.message || "Failed to submit leave request");
      },
    });
  };

  const balance = getLeaveBalance();
  const totalDays = getTotalDays();
  const availableDays = getAvailableDays();
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
                        <div className="flex items-center space-x-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedLeaveType && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                {selectedLeaveType.description}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Maximum {selectedLeaveType.maxDaysPerYear} days per year
              </p>
            </div>
          )}
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

        {/* Leave Balance */}
        {balance && (
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-medium">Leave Balance</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {balance.totalDays}
                </p>
                <p className="text-sm text-gray-500">Total Days</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {balance.usedDays}
                </p>
                <p className="text-sm text-gray-500">Used Days</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {balance.availableDays}
                </p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {balance.carriedOver}
                </p>
                <p className="text-sm text-gray-500">Carried Over</p>
              </div>
            </div>

            {/* Validation Message */}
            {totalDays > 0 && (
              <div
                className={cn(
                  "mt-4 flex items-center space-x-2 rounded-lg p-3",
                  isValid
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                )}
              >
                {isValid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {isValid
                    ? `You have sufficient leave balance for ${totalDays} ${totalDays === 1 ? "day" : "days"}.`
                    : `Insufficient leave balance. You need ${totalDays} ${totalDays === 1 ? "day" : "days"} but only have ${availableDays} available.`}
                </span>
              </div>
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
