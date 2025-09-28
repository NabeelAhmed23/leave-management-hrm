"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  createEmployeeSchema,
  CreateEmployeeInput,
} from "@/schemas/employee.schema";
import { useCreateEmployee } from "@/services/api/employee.api";
import { formatRole } from "@/utils/format-role";
import { Role } from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon, Save, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import z from "zod";

export function CreateEmployeeForm(): React.ReactElement {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createEmployeeMutation = useCreateEmployee();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      departmentId: undefined,
      jobTitle: "",
      managerId: undefined,
      role: Role.EMPLOYEE,
      startDate: new Date().toISOString(),
      endDate: undefined,
      isActive: true,
      sendInvite: true,
      phone: "",
      address: "",
    },
  });

  const { handleSubmit, control, watch } = form;
  const watchedStartDate = watch("startDate");

  const onSubmit = async (
    data: z.infer<typeof createEmployeeSchema>
  ): Promise<void> => {
    try {
      setSubmitError(null);

      const employee = await createEmployeeMutation.mutateAsync(
        data as CreateEmployeeInput
      );

      toast.success(
        data.sendInvite
          ? "Employee created and invitation sent successfully"
          : "Employee created successfully"
      );

      // Redirect to employee details page
      router.push(`/dashboard/employees/${employee.id}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create employee"
      );
      toast.error("Failed to create employee");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information Section */}
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Personal Information
            </h3>
            <p className="text-sm text-gray-600">
              Basic personal details for the employee
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@company.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The employee will receive an invitation at this email
                    address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="123 Main St, City, State, ZIP"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Employment Information Section */}
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Employment Information
            </h3>
            <p className="text-sm text-gray-600">
              Job-related details and organizational structure
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                      field.onChange(value === "none" ? undefined : value)
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
                      field.onChange(value === "none" ? undefined : value)
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
        </div>

        {/* Settings Section */}
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
            <p className="text-sm text-gray-600">
              Employee status and invitation preferences
            </p>
          </div>

          <div className="space-y-4">
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

            <FormField
              control={control}
              name="sendInvite"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Send Invitation Email</FormLabel>
                    <FormDescription>
                      Send an email invitation to set up their account
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{submitError}</div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center space-x-4 border-t pt-6">
          <Button
            type="submit"
            disabled={createEmployeeMutation.isPending}
            className="flex items-center"
          >
            {createEmployeeMutation.isPending ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : form.watch("sendInvite") ? (
              <Send className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {createEmployeeMutation.isPending
              ? "Creating..."
              : form.watch("sendInvite")
                ? "Create & Send Invite"
                : "Create Employee"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/employees")}
            disabled={createEmployeeMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
