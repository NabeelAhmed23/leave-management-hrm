"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DetailedLeaveRequest } from "@/types/leave.types";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PendingLeaveRequestTableProps {
  data: DetailedLeaveRequest[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onApprove: (request: DetailedLeaveRequest) => void;
  onReject: (request: DetailedLeaveRequest) => void;
  isLoading?: boolean;
}

export function PendingLeaveRequestTable({
  data,
  pagination,
  onPageChange,
  onApprove,
  onReject,
  isLoading = false,
}: PendingLeaveRequestTableProps): React.ReactElement {
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
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <div
                  key={j}
                  className="h-4 w-24 animate-pulse rounded bg-gray-200"
                />
              ))}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
          <ClipboardList className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          No pending leave requests
        </h3>
        <p className="text-gray-500">
          There are no pending leave requests to review at the moment.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-center">Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(request => (
                <TableRow key={request.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    #{request.id.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {request.employees[0]?.employee.user.firstName}{" "}
                        {request.employees[0]?.employee.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.employees[0]?.employee.employeeNumber}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.employees[0]?.employee.department?.name || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span>{request.leaveType.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.startDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.endDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{request.totalDays}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {request.reason || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onApprove(request)}
                          className="text-green-600 focus:text-green-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onReject(request)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {generatePageNumbers().map(pageNumber => (
              <Button
                key={pageNumber}
                variant={pageNumber === pagination.page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
                className={cn(
                  "h-8 w-8 p-0",
                  pageNumber === pagination.page && "bg-blue-600 text-white"
                )}
              >
                {pageNumber}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
