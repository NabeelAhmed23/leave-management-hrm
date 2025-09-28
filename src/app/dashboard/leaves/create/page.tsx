"use client";

import { CreateLeaveForm } from "@/components/leaves/create-leave-form";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useSimpleLeaveTypes } from "@/hooks/use-leave-types";
import { Button } from "@/components/ui/button";

export default function CreateLeavePage(): React.ReactElement {
  const {
    data: leaveTypes,
    isLoading: leaveTypesLoading,
    error: leaveTypesError,
  } = useSimpleLeaveTypes();

  const handleSuccess = (): void => {
    // Optional: Add any additional success handling here
    // The form component will handle navigation automatically
  };

  // Loading state
  if (leaveTypesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Skeleton className="h-4 w-20" />
          <span>/</span>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card className="p-6">
          <Skeleton className="h-32 w-full" />
        </Card>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (leaveTypesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link
            href="/dashboard/leaves/my-leaves"
            className="flex items-center hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            My Leaves
          </Link>
          <span>/</span>
          <span className="text-gray-900">Create Request</span>
        </div>

        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Failed to load leave types</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">
            {leaveTypesError.message ||
              "Unable to fetch available leave types. Please try again."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!leaveTypes || leaveTypes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link
            href="/dashboard/leaves/my-leaves"
            className="flex items-center hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            My Leaves
          </Link>
          <span>/</span>
          <span className="text-gray-900">Create Request</span>
        </div>

        <Card className="border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center space-x-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">No leave types available</h3>
          </div>
          <p className="mt-2 text-sm text-amber-700">
            There are no leave types configured for your organization. Please
            contact your HR administrator.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link
          href="/dashboard/leaves/my-leaves"
          className="flex items-center hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          My Leaves
        </Link>
        <span>/</span>
        <span className="text-gray-900">Create Request</span>
      </div>

      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Leave Request
          </h1>
          <p className="text-gray-600">
            Submit a new leave request. Please ensure all details are accurate
            before submitting.
          </p>
        </div>
      </div>

      {/* Guidelines Card */}
      <Card className="border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-3 text-lg font-medium text-blue-900">
          Before You Submit
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-start space-x-3">
            <Calendar className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">Plan Ahead</h4>
              <p className="text-sm text-blue-700">
                Submit requests at least 2 weeks in advance for better approval
                chances.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <FileText className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">Provide Details</h4>
              <p className="text-sm text-blue-700">
                Include a clear reason to help your manager understand your
                request.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Clock className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">Check Balance</h4>
              <p className="text-sm text-blue-700">
                Ensure you have sufficient leave balance before submitting.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Form */}
      <CreateLeaveForm leaveTypes={leaveTypes} onSuccess={handleSuccess} />
    </div>
  );
}
