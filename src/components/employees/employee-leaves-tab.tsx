"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailedEmployee } from "@/types/employee.types";
import { Plus, X, AlertCircle } from "lucide-react";
import { useEmployeeLeaveBalances } from "@/hooks/use-leave-balances";
import { AssignLeaveBalanceForm } from "./assign-leave-balance-form";
import { LeaveBalanceCard } from "./leave-balance-card";
import { LeaveBalanceSummary } from "./leave-balance-summary";
import { LeaveBalanceDetailView } from "./leave-balance-detail-view";
import { EmptyLeaveBalanceState } from "./empty-leave-balance-state";
import { cn } from "@/lib/utils";

interface EmployeeLeavesTabProps {
  employee: DetailedEmployee;
}

export function EmployeeLeavesTab({
  employee,
}: EmployeeLeavesTabProps): React.ReactElement {
  const [showAssignForm, setShowAssignForm] = useState(false);
  const currentYear = new Date().getFullYear();

  // Fetch leave balances using React Query
  const {
    data: employeeWithBalances,
    isLoading,
    error,
    refetch,
  } = useEmployeeLeaveBalances(employee.id, { year: currentYear });

  const leaveBalances = employeeWithBalances?.leaveBalances || [];

  const handleAssignSuccess = (): void => {
    setShowAssignForm(false);
  };

  const handleAssignCancel = (): void => {
    setShowAssignForm(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Leave Balances for {currentYear}
          </h3>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
        <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Failed to Load Leave Balances
            </h3>
            <p className="text-gray-600">
              There was an error loading the leave balances. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If no leave balances exist, show empty state
  if (!employeeWithBalances || leaveBalances.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyLeaveBalanceState
          currentYear={currentYear}
          onAssignClick={() => setShowAssignForm(true)}
        />

        {showAssignForm && (
          <AssignLeaveBalanceForm
            employeeId={employee.id}
            onSuccess={handleAssignSuccess}
            onCancel={handleAssignCancel}
            existingLeaveBalances={leaveBalances}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Leave Balances for {currentYear}
          </h3>
          <Badge variant="outline" className="text-sm">
            {leaveBalances.length} Leave Type
            {leaveBalances.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button
          onClick={() => setShowAssignForm(!showAssignForm)}
          size="sm"
          variant={showAssignForm ? "outline" : "default"}
          className="flex items-center space-x-2"
        >
          {showAssignForm ? (
            <>
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Assign Leave Balance</span>
            </>
          )}
        </Button>
      </div>

      {/* Assign Form */}
      {showAssignForm && (
        <AssignLeaveBalanceForm
          employeeId={employee.id}
          onSuccess={handleAssignSuccess}
          onCancel={handleAssignCancel}
          existingLeaveBalances={leaveBalances}
        />
      )}

      {/* Leave Balance Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="w-full">
          <TabsList
            className={cn(
              "h-10 w-full p-1",
              leaveBalances.length > 3
                ? "scrollbar-hide flex overflow-x-auto"
                : cn(
                    "grid",
                    leaveBalances.length === 0 && "grid-cols-1",
                    leaveBalances.length === 1 && "grid-cols-2",
                    leaveBalances.length === 2 && "grid-cols-3",
                    leaveBalances.length === 3 && "grid-cols-4"
                  )
            )}
          >
            <TabsTrigger
              value="overview"
              className={cn(
                "whitespace-nowrap",
                leaveBalances.length > 3 ? "min-w-[100px] flex-shrink-0" : ""
              )}
            >
              Overview
            </TabsTrigger>
            {leaveBalances.map(balance => (
              <TabsTrigger
                key={balance.id}
                value={balance.leaveType.id}
                className={cn(
                  "whitespace-nowrap",
                  leaveBalances.length > 3 ? "min-w-[120px] flex-shrink-0" : ""
                )}
              >
                {balance.leaveType.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Leave Balance Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leaveBalances.map(balance => (
              <LeaveBalanceCard key={balance.id} balance={balance} />
            ))}
          </div>

          {/* Summary */}
          <LeaveBalanceSummary balances={leaveBalances} />
        </TabsContent>

        {/* Individual Leave Type Tabs */}
        {leaveBalances.map(balance => (
          <TabsContent
            key={balance.id}
            value={balance.leaveType.id}
            className="space-y-6"
          >
            <LeaveBalanceDetailView balance={balance} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
