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

interface LeaveBalanceDetailViewProps {
  balance: LeaveBalance;
}

export function LeaveBalanceDetailView({
  balance,
}: LeaveBalanceDetailViewProps): React.ReactElement {
  const usagePercentage =
    balance.totalDays > 0 ? (balance.usedDays / balance.totalDays) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{balance.leaveType.name}</span>
          <Badge
            variant={balance.availableDays > 0 ? "default" : "destructive"}
          >
            {balance.availableDays} days remaining
          </Badge>
        </CardTitle>
        {balance.leaveType.description && (
          <p className="text-gray-600">{balance.leaveType.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Large Visual Display */}
        <div className="space-y-2 text-center">
          <div className="text-primary text-6xl font-bold">
            {balance.availableDays}
          </div>
          <p className="text-lg text-gray-600">Days Available</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Usage Progress</span>
            <span className="text-sm text-gray-600">
              {balance.usedDays} of {balance.totalDays} days used
            </span>
          </div>
          <Progress
            value={usagePercentage}
            className="h-3"
            indicatorClassName={
              usagePercentage >= 90
                ? "bg-red-500"
                : usagePercentage >= 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }
          />
          <p className="text-center text-sm text-gray-500">
            {usagePercentage.toFixed(1)}% used
          </p>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="mb-2 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-700">
              {balance.availableDays}
            </div>
            <p className="text-sm text-green-600">Available</p>
          </div>

          <div className="rounded-lg bg-red-50 p-4 text-center">
            <div className="mb-2 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-700">
              {balance.usedDays}
            </div>
            <p className="text-sm text-red-600">Used</p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <div className="mb-2 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {balance.totalDays}
            </div>
            <p className="text-sm text-blue-600">Total Allocation</p>
          </div>

          {balance.carriedOver > 0 && (
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <div className="mb-2 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-700">
                {balance.carriedOver}
              </div>
              <p className="text-sm text-purple-600">Carried Over</p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="rounded-lg border-l-4 border-l-current p-4">
          {balance.availableDays <= 0 ? (
            <div className="text-red-600">
              <div className="mb-1 flex items-center space-x-2">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">No Days Remaining</span>
              </div>
              <p className="text-sm">
                This employee has exhausted their{" "}
                {balance.leaveType.name.toLowerCase()} allocation for{" "}
                {balance.year}.
              </p>
            </div>
          ) : balance.availableDays <= 3 ? (
            <div className="text-yellow-600">
              <div className="mb-1 flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Low Balance Warning</span>
              </div>
              <p className="text-sm">
                Only {balance.availableDays} days remaining. Consider planning
                leave carefully.
              </p>
            </div>
          ) : (
            <div className="text-green-600">
              <div className="mb-1 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Healthy Balance</span>
              </div>
              <p className="text-sm">
                Good availability with {balance.availableDays} days remaining.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
