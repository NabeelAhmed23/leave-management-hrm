"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailedEmployee } from "@/types/employee.types";
import { useDeleteEmployee } from "@/services/api/employee.api";
import { formatRole } from "@/utils/format-role";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface EmployeesTableProps {
  employees: DetailedEmployee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export function EmployeesTable({
  employees,
  pagination,
  isLoading = false,
  onPageChange,
}: EmployeesTableProps): React.ReactElement {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] =
    useState<DetailedEmployee | null>(null);

  const deleteEmployeeMutation = useDeleteEmployee();

  const handleDeleteClick = (employee: DetailedEmployee): void => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!employeeToDelete) return;

    try {
      await deleteEmployeeMutation.mutateAsync(employeeToDelete.id);
      toast.success("Employee deleted successfully");
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch {
      toast.error("Failed to delete employee");
    }
  };

  const generatePageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const { page, pages: totalPages } = pagination;

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex space-x-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4">
        <UserCheck className="h-12 w-12 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            No employees found
          </h3>
          <p className="text-gray-600">
            No employees match your current filters. Try adjusting your search
            criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.employeeNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {employee.user
                          ? `${employee.user.firstName} ${employee.user.lastName}`
                          : "Pending Setup"}
                      </span>
                      {employee.jobTitle && (
                        <span className="text-sm text-gray-500">
                          {employee.jobTitle}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {employee.user?.email ||
                      (employee.invite ? employee.invite.email : "N/A")}
                  </TableCell>
                  <TableCell>
                    {employee.department?.name || (
                      <span className="text-gray-500">No department</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {formatRole(employee.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
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
                      {!employee.user &&
                        employee.invite?.status === "PENDING" && (
                          <Badge
                            variant="outline"
                            className="border-orange-200 text-orange-600"
                          >
                            Invite Pending
                          </Badge>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/employees/${employee.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(employee)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                results
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {generatePageNumbers().map(pageNum => (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === pagination.page ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="h-8 w-8"
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {employeeToDelete?.user
                  ? `${employeeToDelete.user.firstName} ${employeeToDelete.user.lastName}`
                  : employeeToDelete?.employeeNumber}
              </strong>
              ? This action will deactivate the employee and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteEmployeeMutation.isPending}
            >
              {deleteEmployeeMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
