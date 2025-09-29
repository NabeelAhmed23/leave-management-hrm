"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeaveBalance {
  id: string;
  year: number;
  totalDays: number;
  usedDays: number;
  availableDays: number;
  carriedOver: number;
  leaveType: {
    id: string;
    name: string;
    description?: string | null;
    maxDaysPerYear: number;
  };
}

interface LeaveBalanceSummaryProps {
  balances: LeaveBalance[];
}

export function LeaveBalanceSummary({
  balances,
}: LeaveBalanceSummaryProps): React.ReactElement {
  const totalAvailable = balances.reduce(
    (sum, balance) => sum + balance.availableDays,
    0
  );
  const totalUsed = balances.reduce(
    (sum, balance) => sum + balance.usedDays,
    0
  );
  const totalAllocated = balances.reduce(
    (sum, balance) => sum + balance.totalDays,
    0
  );
  const totalCarriedOver = balances.reduce(
    (sum, balance) => sum + balance.carriedOver,
    0
  );

  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
          <div>
            <p className="text-gray-600">Total Available Days</p>
            <p className="text-lg font-semibold text-green-600">
              {totalAvailable}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Used Days</p>
            <p className="text-lg font-semibold text-red-600">{totalUsed}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Allocated Days</p>
            <p className="text-lg font-semibold text-blue-600">
              {totalAllocated}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Carried Over</p>
            <p className="text-lg font-semibold text-purple-600">
              {totalCarriedOver}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
