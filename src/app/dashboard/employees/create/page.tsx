"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateEmployeeForm } from "@/components/employees/create-employee-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CreateEmployeePage(): React.ReactElement {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Check authorization
  useEffect(() => {
    if (!isLoading && user) {
      const userRole = user.employee?.role;
      if (!userRole || !["HR_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
        router.replace("/dashboard");
        return;
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRole = user?.employee?.role;
  if (!userRole || !["HR_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-center text-gray-600">
          You don&apos;t have permission to access this page. Only HR
          Administrators and Super Administrators can create employees.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <Link href="/dashboard/employees" className="block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Create Employee</h1>
          <p className="text-gray-600">
            Add a new employee to your organization
          </p>
        </div>
      </div>

      {/* Create Employee Form */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateEmployeeForm />
        </CardContent>
      </Card>
    </div>
  );
}
