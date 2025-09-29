"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

interface EmptyLeaveBalanceStateProps {
  currentYear: number;
  onAssignClick: () => void;
}

export function EmptyLeaveBalanceState({
  currentYear,
  onAssignClick,
}: EmptyLeaveBalanceStateProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Leave Balances for {currentYear}
        </h3>
        <Button
          onClick={onAssignClick}
          size="sm"
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Assign Leave Balance</span>
        </Button>
      </div>

      <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4">
        <Calendar className="h-12 w-12 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            No Leave Balances
          </h3>
          <p className="text-gray-600">
            This employee has no leave balances configured for the current year.
          </p>
        </div>
      </div>
    </div>
  );
}
