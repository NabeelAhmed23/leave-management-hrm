"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { DetailedEmployee } from "@/types/employee.types";
import { useUpdateEmployee } from "@/services/api/employee.api";
import { formatRole } from "@/utils/format-role";
import { Role } from "@prisma/client";
import { format } from "date-fns";
import * as z from "zod";
import { Edit3, X, Check, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const employmentInfoSchema = z.object({
  employeeNumber: z.string().min(1, "Employee number is required"),
  jobTitle: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "HR_ADMIN", "SUPER_ADMIN"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  isActive: z.boolean(),
});

type EmploymentInfoFormData = z.infer<typeof employmentInfoSchema>;

interface EmployeeEmploymentTabProps {
  employee: DetailedEmployee;
}

export function EmployeeEmploymentTab({
  employee,
}: EmployeeEmploymentTabProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateEmployeeMutation = useUpdateEmployee();

  const form = useForm<EmploymentInfoFormData>({
    resolver: zodResolver(employmentInfoSchema),
    defaultValues: {
      employeeNumber: employee.employeeNumber,
      jobTitle: employee.jobTitle || "",
      departmentId: employee.departmentId || "",
      managerId: employee.managerId || "",
      role: employee.role,
      startDate: employee.startDate
        ? new Date(employee.startDate).toISOString()
        : "",
      endDate: employee.endDate ? new Date(employee.endDate).toISOString() : "",
      isActive: employee.isActive,
    },
  });

  const { handleSubmit, control, reset, watch } = form;
  const watchedStartDate = watch("startDate");

  const onSubmit = async (data: EmploymentInfoFormData): Promise<void> => {
    try {
      setSubmitError(null);

      const updateData = {
        ...data,
        departmentId: data.departmentId || null,
        managerId: data.managerId || null,
        jobTitle: data.jobTitle || null,
        endDate: data.endDate || null,
      };

      await updateEmployeeMutation.mutateAsync({
        id: employee.id,
        data: updateData,
      });

      toast.success("Employment information updated successfully");
      setIsEditing(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to update employee"
      );
      toast.error("Failed to update employment information");
    }
  };

  const handleCancel = (): void => {
    reset();
    setIsEditing(false);
    setSubmitError(null);
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Employment Information
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-500">
              Employee Number
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {employee.employeeNumber}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">
              Job Title
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {employee.jobTitle || "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">
              Department
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {employee.department?.name || "No department assigned"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Manager</label>
            <p className="mt-1 text-sm text-gray-900">
              {employee.manager?.user
                ? `${employee.manager.user.firstName} ${employee.manager.user.lastName}`
                : "No manager assigned"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Role</label>
            <p className="mt-1 text-sm text-gray-900">
              {formatRole(employee.role)}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <p className="mt-1 text-sm text-gray-900">
              {employee.isActive ? "Active" : "Inactive"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">
              Start Date
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {format(employee.startDate, "PPP")}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">
              End Date
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {employee.endDate ? format(employee.endDate, "PPP") : "N/A"}
            </p>
          </div>
        </div>

        {employee._count && (
          <div className="grid grid-cols-1 gap-6 border-t pt-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Subordinates
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {employee._count.subordinates}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Leave Requests
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {employee._count.leaveRequests}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Leave Balances
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {employee._count.leaveBalances}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Edit Employment Information
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={updateEmployeeMutation.isPending}
            className="flex items-center"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="employeeNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Number</FormLabel>
                  <FormControl>
                    <Input placeholder="EMP001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={value =>
                      field.onChange(value === "none" ? "" : value)
                    }
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Department</SelectItem>
                      {/* TODO: Add department options from API */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager</FormLabel>
                  <Select
                    onValueChange={value =>
                      field.onChange(value === "none" ? "" : value)
                    }
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Manager</SelectItem>
                      {/* TODO: Add manager options from API */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Role.EMPLOYEE}>
                        {formatRole(Role.EMPLOYEE)}
                      </SelectItem>
                      <SelectItem value={Role.MANAGER}>
                        {formatRole(Role.MANAGER)}
                      </SelectItem>
                      <SelectItem value={Role.HR_ADMIN}>
                        {formatRole(Role.HR_ADMIN)}
                      </SelectItem>
                      <SelectItem value={Role.SUPER_ADMIN}>
                        {formatRole(Role.SUPER_ADMIN)}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
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
                            format(new Date(field.value), "PPP")
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
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={date => field.onChange(date?.toISOString())}
                        disabled={date => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date (Optional)</FormLabel>
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
                            format(new Date(field.value), "PPP")
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
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={date => field.onChange(date?.toISOString())}
                        disabled={date =>
                          date <
                          (watchedStartDate
                            ? new Date(watchedStartDate)
                            : new Date())
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Leave empty for permanent employment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active Employee</FormLabel>
                  <FormDescription>
                    Mark as active to allow the employee to access the system
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Error Display */}
          {submitError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{submitError}</div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center space-x-4 border-t pt-4">
            <Button
              type="submit"
              disabled={updateEmployeeMutation.isPending}
              className="flex items-center"
            >
              {updateEmployeeMutation.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {updateEmployeeMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
