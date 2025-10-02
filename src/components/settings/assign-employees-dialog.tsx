"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useEmployees } from "@/services/api/employee.api";
import {
  useEmployeesAssignedToLeaveType,
  useUpdateLeaveTypeAssignments,
} from "@/hooks/use-leave-balances";
import { Building2, User } from "lucide-react";

interface LeaveType {
  id: string;
  name: string;
  defaultDays: number;
}

interface AssignEmployeesDialogProps {
  leaveType: LeaveType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignEmployeesDialog({
  leaveType,
  open,
  onOpenChange,
}: AssignEmployeesDialogProps): React.ReactElement {
  const currentYear = new Date().getFullYear();
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(
    new Set()
  );

  // Fetch all active employees
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    page: 1,
    limit: 0,
    isActive: true,
  });

  // Fetch employees already assigned to this leave type
  const { data: assignedEmployeeIds, isLoading: isLoadingAssigned } =
    useEmployeesAssignedToLeaveType(leaveType.id, currentYear, {
      enabled: open,
    });

  // Update assignments mutation
  const updateAssignmentsMutation = useUpdateLeaveTypeAssignments();

  // Initialize selected employees when assigned employees are loaded
  useEffect(() => {
    if (assignedEmployeeIds && open) {
      setSelectedEmployeeIds(new Set(assignedEmployeeIds));
    }
  }, [assignedEmployeeIds, open]);

  const handleToggleEmployee = (employeeId: string): void => {
    setSelectedEmployeeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (): void => {
    if (employeesData?.employees) {
      const allEmployeeIds = employeesData.employees.map(emp => emp.id);
      setSelectedEmployeeIds(new Set(allEmployeeIds));
    }
  };

  const handleDeselectAll = (): void => {
    setSelectedEmployeeIds(new Set());
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      await updateAssignmentsMutation.mutateAsync({
        employeeIds: Array.from(selectedEmployeeIds),
        leaveTypeId: leaveType.id,
        year: currentYear,
        totalDays: leaveType.defaultDays,
        carriedOver: 0,
      });

      onOpenChange(false);
    } catch {
      // Error is already handled by the mutation
    }
  };

  const employees = employeesData?.employees || [];
  const isLoading = isLoadingEmployees || isLoadingAssigned;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Employees to {leaveType.name}</DialogTitle>
          <DialogDescription>
            Select employees to assign this leave type. Default allocation:{" "}
            {leaveType.defaultDays} days for {currentYear}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {employees.length === 0 ? (
              <div className="py-12 text-center">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No employees found
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  There are no active employees in your organization.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b pb-3">
                  <p className="text-sm text-gray-500">
                    {selectedEmployeeIds.size} of {employees.length} selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDeselectAll}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {employees.map(employee => {
                      const isChecked = selectedEmployeeIds.has(employee.id);
                      const employeeName = employee.user
                        ? `${employee.user.firstName} ${employee.user.lastName}`
                        : "Unknown Employee";

                      return (
                        <div
                          key={employee.id}
                          className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-gray-50"
                        >
                          <Checkbox
                            id={employee.id}
                            checked={isChecked}
                            onCheckedChange={() =>
                              handleToggleEmployee(employee.id)
                            }
                          />
                          <label
                            htmlFor={employee.id}
                            className="flex flex-1 cursor-pointer items-center justify-between"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {employeeName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {employee.employeeNumber}
                              </p>
                            </div>
                            {employee.department && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Building2 className="h-4 w-4" />
                                {employee.department.name}
                              </div>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}
          </>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateAssignmentsMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || updateAssignmentsMutation.isPending}
          >
            {updateAssignmentsMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Updating...
              </>
            ) : (
              `Update Assignments (${selectedEmployeeIds.size})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
