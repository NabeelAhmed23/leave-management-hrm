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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Edit, MoreHorizontal, Trash2, Users } from "lucide-react";
import { DetailedLeaveType } from "@/types/leave-type.types";
import { EditLeaveTypeDialog } from "./edit-leave-type-dialog";
import { DeleteLeaveTypeDialog } from "./delete-leave-type-dialog";
import { AssignEmployeesDialog } from "./assign-employees-dialog";
import { formatDistanceToNow } from "date-fns";

interface LeaveTypesTableProps {
  leaveTypes: DetailedLeaveType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function LeaveTypesTable({
  leaveTypes,
  pagination,
  currentPage,
  onPageChange,
}: LeaveTypesTableProps): React.ReactElement {
  const [editingLeaveType, setEditingLeaveType] =
    useState<DetailedLeaveType | null>(null);
  const [deletingLeaveType, setDeletingLeaveType] =
    useState<DetailedLeaveType | null>(null);
  const [assigningLeaveType, setAssigningLeaveType] =
    useState<DetailedLeaveType | null>(null);

  const handleEdit = (leaveType: DetailedLeaveType) => {
    setEditingLeaveType(leaveType);
  };

  const handleDelete = (leaveType: DetailedLeaveType) => {
    setDeletingLeaveType(leaveType);
  };

  const handleAssignEmployees = (leaveType: DetailedLeaveType) => {
    setAssigningLeaveType(leaveType);
  };

  const renderPagination = () => {
    // Always show pagination info if there are results, even for single page
    if (pagination.total === 0) return null;

    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(pagination.pages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(i)}
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="mt-4 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
          {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
          {pagination.total} results
        </p>
        {pagination.pages > 1 && (
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {pages}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === pagination.pages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Max Days/Year</TableHead>
              {/* <TableHead>Usage</TableHead> */}
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveTypes.map(leaveType => (
              <TableRow key={leaveType.id}>
                <TableCell className="font-medium">{leaveType.name}</TableCell>
                <TableCell>
                  {leaveType.description ? (
                    <span className="text-muted-foreground text-sm">
                      {leaveType.description}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm italic">
                      No description
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {leaveType.maxDaysPerYear} days
                  </Badge>
                </TableCell>
                {/* <TableCell>
                  {leaveType._count ? (
                    <div className="flex flex-col text-sm">
                      <span>{leaveType._count.leaveRequests} requests</span>
                      <span className="text-muted-foreground">
                        {leaveType._count.leaveBalances} balances
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      No usage
                    </span>
                  )}
                </TableCell> */}
                <TableCell>
                  <span className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(leaveType.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
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
                      <DropdownMenuItem
                        onClick={() => handleAssignEmployees(leaveType)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Add employees
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(leaveType)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(leaveType)}
                        className="text-destructive"
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

      {renderPagination()}

      {/* Edit Dialog */}
      {editingLeaveType && (
        <EditLeaveTypeDialog
          leaveType={editingLeaveType}
          open={!!editingLeaveType}
          onOpenChange={open => !open && setEditingLeaveType(null)}
        />
      )}

      {/* Delete Dialog */}
      {deletingLeaveType && (
        <DeleteLeaveTypeDialog
          leaveType={deletingLeaveType}
          open={!!deletingLeaveType}
          onOpenChange={open => !open && setDeletingLeaveType(null)}
        />
      )}

      {/* Assign Employees Dialog */}
      {assigningLeaveType && (
        <AssignEmployeesDialog
          leaveType={{
            id: assigningLeaveType.id,
            name: assigningLeaveType.name,
            defaultDays: assigningLeaveType.maxDaysPerYear,
          }}
          open={!!assigningLeaveType}
          onOpenChange={open => !open && setAssigningLeaveType(null)}
        />
      )}
    </>
  );
}
