"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeesTable } from "@/components/employees/employees-table";
import { EmployeeFilters } from "@/components/employees/employee-filters";
import { useEmployees } from "@/services/api/employee.api";
import { QueryEmployeesDTO } from "@/types/employee.types";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function EmployeesPage(): React.ReactElement {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Filter and pagination state
  const [filters, setFilters] = useState<QueryEmployeesDTO>({
    page: 1,
    limit: 10,
  });

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

  // Fetch employees
  const {
    data: employeesData,
    isLoading: isLoadingEmployees,
    error,
  } = useEmployees(filters);

  const handleFiltersChange = (
    newFilters: Partial<QueryEmployeesDTO>
  ): void => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number): void => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

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
          Administrators and Super Administrators can manage employees.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-center text-gray-600">
          Failed to load employees. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">
            Manage your organization&apos;s employees and their information
          </p>
        </div>
        <Link href="/dashboard/employees/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Employees
            {employeesData && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({employeesData.pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeesTable
            employees={employeesData?.employees || []}
            pagination={
              employeesData?.pagination || {
                page: 1,
                limit: 10,
                total: 0,
                pages: 0,
              }
            }
            isLoading={isLoadingEmployees}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
