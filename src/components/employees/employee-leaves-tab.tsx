"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DetailedEmployee } from "@/types/employee.types";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

interface EmployeeLeavesTabProps {
  employee: DetailedEmployee;
}

export function EmployeeLeavesTab({
  employee,
}: EmployeeLeavesTabProps): React.ReactElement {
  // Cast to include leave balances if they exist
  const employeeWithBalances = employee as DetailedEmployee & {
    leaveBalances?: Array<{
      id: string;
      year: number;
      totalDays: number;
      usedDays: number;
      availableDays: number;
      carriedOver: number;
      leaveType: {
        id: string;
        name: string;
        description?: string;
        maxDaysPerYear: number;
      };
    }>;
  };

  const currentYear = new Date().getFullYear();
  const leaveBalances =
    employeeWithBalances.leaveBalances?.filter(
      balance => balance.year === currentYear
    ) || [];

  if (!employeeWithBalances.leaveBalances || leaveBalances.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Leave Balances for {currentYear}
        </h3>
        <Badge variant="outline" className="text-sm">
          {leaveBalances.length} Leave Type
          {leaveBalances.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leaveBalances.map(balance => {
          const usagePercentage =
            balance.totalDays > 0
              ? (balance.usedDays / balance.totalDays) * 100
              : 0;

          return (
            <Card
              key={balance.id}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base font-semibold">
                  <span>{balance.leaveType.name}</span>
                  <Badge
                    variant={
                      balance.availableDays > 0 ? "default" : "destructive"
                    }
                    className="text-xs"
                  >
                    {balance.availableDays} left
                  </Badge>
                </CardTitle>
                {balance.leaveType.description && (
                  <p className="text-sm text-gray-600">
                    {balance.leaveType.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usage</span>
                    <span className="font-medium">
                      {balance.usedDays} / {balance.totalDays} days
                    </span>
                  </div>
                  <Progress
                    value={usagePercentage}
                    className="h-2"
                    indicatorClassName={
                      usagePercentage >= 90
                        ? "bg-red-500"
                        : usagePercentage >= 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }
                  />
                  <p className="text-xs text-gray-500">
                    {usagePercentage.toFixed(1)}% used
                  </p>
                </div>

                {/* Balance Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-gray-600">Available</p>
                      <p className="font-semibold">{balance.availableDays}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-gray-600">Used</p>
                      <p className="font-semibold">{balance.usedDays}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-semibold">{balance.totalDays}</p>
                    </div>
                  </div>

                  {balance.carriedOver > 0 && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-gray-600">Carried Over</p>
                        <p className="font-semibold">{balance.carriedOver}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="border-t pt-2">
                  {balance.availableDays <= 0 ? (
                    <div className="flex items-center space-x-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        No days remaining
                      </span>
                    </div>
                  ) : balance.availableDays <= 3 ? (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Low balance</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Available</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-gray-600">Total Available Days</p>
              <p className="text-lg font-semibold text-green-600">
                {leaveBalances.reduce(
                  (sum, balance) => sum + balance.availableDays,
                  0
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Used Days</p>
              <p className="text-lg font-semibold text-red-600">
                {leaveBalances.reduce(
                  (sum, balance) => sum + balance.usedDays,
                  0
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Allocated Days</p>
              <p className="text-lg font-semibold text-blue-600">
                {leaveBalances.reduce(
                  (sum, balance) => sum + balance.totalDays,
                  0
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Carried Over</p>
              <p className="text-lg font-semibold text-purple-600">
                {leaveBalances.reduce(
                  (sum, balance) => sum + balance.carriedOver,
                  0
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
