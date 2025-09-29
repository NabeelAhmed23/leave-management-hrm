"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

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

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
}

export function LeaveBalanceCard({
  balance,
}: LeaveBalanceCardProps): React.ReactElement {
  const usagePercentage =
    balance.totalDays > 0 ? (balance.usedDays / balance.totalDays) * 100 : 0;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span>{balance.leaveType.name}</span>
          <Badge
            variant={balance.availableDays > 0 ? "default" : "destructive"}
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
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-gray-600">Available</p>
              <p className="font-semibold">{balance.availableDays}</p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-gray-600">Used</p>
              <p className="font-semibold">{balance.usedDays}</p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-gray-600">Total</p>
              <p className="font-semibold">{balance.totalDays}</p>
            </div>
          </div>

          {balance.carriedOver > 0 && (
            <div className="flex items-start space-x-2">
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
              <span className="text-sm font-medium">No days remaining</span>
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
}
