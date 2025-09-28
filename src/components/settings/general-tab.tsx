"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Save, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useOrganization,
  useUpdateOrganization,
} from "@/services/api/organization.api";

const generalSettingsSchema = z.object({
  leaveRenewalDate: z.date({
    required_error: "Leave renewal date is required",
  }),
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

export function GeneralTab(): React.ReactElement {
  const {
    data: organization,
    isLoading: isLoadingOrg,
    error: orgError,
  } = useOrganization();

  const updateOrganizationMutation = useUpdateOrganization();

  const form = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      // Default to January 1st of current year
      leaveRenewalDate: new Date(new Date().getFullYear(), 0, 1),
    },
  });

  // Update form values when organization data is loaded
  useEffect(() => {
    if (organization) {
      const renewalDate = organization.leaveRefreshDate
        ? new Date(organization.leaveRefreshDate)
        : new Date(new Date().getFullYear(), 0, 1);

      form.setValue("leaveRenewalDate", renewalDate);
    }
  }, [organization, form]);

  const handleSubmit = async (data: GeneralSettingsFormData): Promise<void> => {
    try {
      await updateOrganizationMutation.mutateAsync({
        leaveRefreshDate: data.leaveRenewalDate.toISOString(),
      });

      toast.success("General settings saved successfully");
    } catch {
      toast.error("Failed to save general settings");
    }
  };

  const isLoading = updateOrganizationMutation.isPending;

  // Loading state while fetching organization data
  if (isLoadingOrg) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-[240px]" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-[120px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (orgError) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to Load Organization Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-red-700">
              Unable to fetch organization data. Please try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="leaveRenewalDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Leave Renewal Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
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
                          disabled={date => date < new Date("1900-01-01")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the annual date when employee leave balances are
                      renewed. This is typically January 1st for calendar year
                      renewals or your organization&apos;s fiscal year start
                      date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>Save Settings</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Leave Renewal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">What is Leave Renewal Date?</h4>
            <p className="text-muted-foreground text-sm">
              The leave renewal date determines when employee leave balances are
              reset or renewed each year. This affects when employees receive
              their annual leave allocation and when carry-over policies take
              effect.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Common Renewal Patterns</h4>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>
                • <strong>Calendar Year:</strong> January 1st
              </li>
              <li>
                • <strong>Fiscal Year:</strong> April 1st or October 1st
              </li>
              <li>
                • <strong>Anniversary:</strong> Employee&apos;s hire date
                (handled separately)
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">
                  Important Note
                </h4>
                <p className="mt-1 text-sm text-blue-700">
                  Changing this date will affect future leave calculations.
                  Consult with your HR team before making changes to ensure it
                  aligns with your organization&apos;s policies.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
