"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { useSimpleLeaveTypes } from "@/services/api/leave-type.api";
import { useAssignLeaveType } from "@/hooks/use-leave-balances";
import {
  assignLeaveTypeSchema,
  type AssignLeaveTypeInput,
} from "@/schemas/leave-balance.schema";

interface AssignLeaveBalanceFormProps {
  employeeId: string;
  onSuccess: () => void;
  onCancel: () => void;
  existingLeaveBalances?: Array<{
    id: string;
    year: number;
    leaveType: {
      id: string;
      name: string;
    };
  }>;
}

export function AssignLeaveBalanceForm({
  employeeId,
  onSuccess,
  onCancel,
  existingLeaveBalances = [],
}: AssignLeaveBalanceFormProps): React.ReactElement {
  const currentYear = new Date().getFullYear();

  const { data: leaveTypes, isLoading: isLoadingLeaveTypes } =
    useSimpleLeaveTypes(true);
  const assignLeaveTypeMutation = useAssignLeaveType();

  const form = useForm<AssignLeaveTypeInput>({
    resolver: zodResolver(assignLeaveTypeSchema),
    defaultValues: {
      leaveTypeId: "",
      year: currentYear,
      totalDays: 0,
      carriedOver: 0,
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  // Filter out leave types that are already assigned for the selected year
  const selectedYear = form.watch("year");
  const availableLeaveTypes =
    leaveTypes?.filter(
      leaveType =>
        !existingLeaveBalances.some(
          existing =>
            existing.leaveType.id === leaveType.id &&
            existing.year === selectedYear
        )
    ) || [];

  const handleLeaveTypeChange = (leaveTypeId: string): void => {
    const selectedType = leaveTypes?.find(lt => lt.id === leaveTypeId);
    if (selectedType) {
      form.setValue("totalDays", selectedType.maxDaysPerYear);
    }
  };

  const onSubmit = async (data: AssignLeaveTypeInput): Promise<void> => {
    try {
      await assignLeaveTypeMutation.mutateAsync({
        employeeId,
        data,
      });
      onSuccess();
      form.reset({
        leaveTypeId: "",
        year: currentYear,
        totalDays: 0,
        carriedOver: 0,
      });
    } catch {
      // Error handling is done in the mutation hook
    }
  };

  const handleCancel = (): void => {
    if (!assignLeaveTypeMutation.isPending) {
      onCancel();
      form.reset({
        leaveTypeId: "",
        year: currentYear,
        totalDays: 0,
        carriedOver: 0,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Assign Leave Balance</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={assignLeaveTypeMutation.isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2024"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        disabled={assignLeaveTypeMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leaveTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={value => {
                        field.onChange(value);
                        handleLeaveTypeChange(value);
                      }}
                      disabled={
                        assignLeaveTypeMutation.isPending || isLoadingLeaveTypes
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableLeaveTypes.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            {isLoadingLeaveTypes
                              ? "Loading leave types..."
                              : "No available leave types for this year"}
                          </div>
                        ) : (
                          availableLeaveTypes.map(leaveType => (
                            <SelectItem key={leaveType.id} value={leaveType.id}>
                              {leaveType.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        disabled={assignLeaveTypeMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carriedOver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carried Over Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        disabled={assignLeaveTypeMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={assignLeaveTypeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || availableLeaveTypes.length === 0}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Assign Balance
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
