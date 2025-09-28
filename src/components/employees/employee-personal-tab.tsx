"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { DetailedEmployee } from "@/types/employee.types";
import { useUpdateEmployee } from "@/services/api/employee.api";
import * as z from "zod";
import { Edit3, X, Check } from "lucide-react";
import { toast } from "sonner";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

interface EmployeePersonalTabProps {
  employee: DetailedEmployee;
}

function NoUserAccountDisplay(): React.ReactElement {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">No User Account</h3>
        <p className="text-gray-600">
          This employee has not been set up with a user account yet.
        </p>
      </div>
    </div>
  );
}

interface PersonalInfoDisplayProps {
  employee: DetailedEmployee;
  onEdit: () => void;
}

function PersonalInfoDisplay({
  employee,
  onEdit,
}: PersonalInfoDisplayProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Personal Information
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex items-center"
        >
          <Edit3 className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-500">
            First Name
          </label>
          <p className="mt-1 text-sm text-gray-900">
            {employee.user?.firstName || employee.invite?.firstName || "N/A"}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">Last Name</label>
          <p className="mt-1 text-sm text-gray-900">
            {employee.user?.lastName || employee.invite?.lastName || "N/A"}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">
            Email Address
          </label>
          <p className="mt-1 text-sm text-gray-900">
            {employee.user?.email || employee.invite?.email || "N/A"}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">
            Phone Number
          </label>
          <p className="mt-1 text-sm text-gray-900">
            {employee.phone || "Not provided"}
          </p>
        </div>
      </div>

      {employee.address && (
        <div>
          <label className="text-sm font-medium text-gray-500">Address</label>
          <p className="mt-1 text-sm whitespace-pre-wrap text-gray-900">
            {employee.address}
          </p>
        </div>
      )}
    </div>
  );
}

interface PersonalInfoEditFormProps {
  employee: DetailedEmployee;
  form: ReturnType<typeof useForm<PersonalInfoFormData>>;
  onSubmit: (data: PersonalInfoFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

function PersonalInfoEditForm({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
}: PersonalInfoEditFormProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Edit Personal Information
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
            control={form.control}
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

          {submitError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{submitError}</div>
            </div>
          )}

          <div className="flex items-center space-x-4 border-t pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center"
            >
              {isSubmitting ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export function EmployeePersonalTab({
  employee,
}: EmployeePersonalTabProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateEmployeeMutation = useUpdateEmployee();

  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: employee.user?.firstName || "",
      lastName: employee.user?.lastName || "",
      email: employee.user?.email || employee.invite?.email || "",
      phone: employee.phone || "",
      address: employee.address || "",
    },
  });

  const onSubmit = async (data: PersonalInfoFormData): Promise<void> => {
    try {
      setSubmitError(null);

      await updateEmployeeMutation.mutateAsync({
        id: employee.id,
        data,
      });

      toast.success("Personal information updated successfully");
      setIsEditing(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to update employee"
      );
      toast.error("Failed to update personal information");
    }
  };

  const handleCancel = (): void => {
    form.reset();
    setIsEditing(false);
    setSubmitError(null);
  };

  if (!employee.user && !employee.invite) {
    return <NoUserAccountDisplay />;
  }

  if (!isEditing) {
    return (
      <PersonalInfoDisplay
        employee={employee}
        onEdit={() => setIsEditing(true)}
      />
    );
  }

  return (
    <PersonalInfoEditForm
      employee={employee}
      form={form}
      onSubmit={onSubmit}
      onCancel={handleCancel}
      isSubmitting={updateEmployeeMutation.isPending}
      submitError={submitError}
    />
  );
}
