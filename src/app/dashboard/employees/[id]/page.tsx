"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeePersonalTab } from "@/components/employees/employee-personal-tab";
import { EmployeeEmploymentTab } from "@/components/employees/employee-employment-tab";
import { EmployeeLeavesTab } from "@/components/employees/employee-leaves-tab";
import { useEmployee } from "@/services/api/employee.api";
import { formatRole } from "@/utils/format-role";
import { ArrowLeft, Mail, User, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function EmployeeDetailsPage(): React.ReactElement {
  const params = useParams();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const employeeId = params.id as string;

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

  // Fetch employee data
  const {
    data: employee,
    isLoading: isLoadingEmployee,
    error,
  } = useEmployee(employeeId, true); // Include leave balances

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
          Administrators and Super Administrators can view employee details.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-center text-gray-600">
          Failed to load employee details. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (isLoadingEmployee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
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

  if (!employee) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Employee Not Found</h1>
        <p className="text-center text-gray-600">
          The employee you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have permission to view it.
        </p>
        <Link href="/dashboard/employees">
          <Button>Back to Employees</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col space-y-4">
          <Link href="/dashboard/employees" className="block">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {employee.user
                  ? `${employee.user.firstName} ${employee.user.lastName}`
                  : "Pending Setup"}
              </h1>
              <Badge
                variant={employee.isActive ? "default" : "destructive"}
                className={cn(
                  employee.isActive
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                )}
              >
                {employee.isActive ? (
                  <>
                    <UserCheck className="mr-1 h-3 w-3" />
                    Active
                  </>
                ) : (
                  <>
                    <UserX className="mr-1 h-3 w-3" />
                    Inactive
                  </>
                )}
              </Badge>
              {!employee.user && employee.invite?.status === "PENDING" && (
                <Badge
                  variant="outline"
                  className="border-orange-200 text-orange-600"
                >
                  <Mail className="mr-1 h-3 w-3" />
                  Invite Pending
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4 text-gray-600">
              <span className="flex items-center">
                <User className="mr-1 h-4 w-4" />
                {employee.employeeNumber}
              </span>
              {employee.jobTitle && <span>•</span>}
              {employee.jobTitle && <span>{employee.jobTitle}</span>}
              {employee.department && <span>•</span>}
              {employee.department && <span>{employee.department.name}</span>}
              <span>•</span>
              <Badge variant="secondary">{formatRole(employee.role)}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Details Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeePersonalTab employee={employee} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeEmploymentTab employee={employee} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeLeavesTab employee={employee} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
