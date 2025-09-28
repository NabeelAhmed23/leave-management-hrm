"use client";

import { useState } from "react";
import { CreateLeaveForm } from "@/components/leaves/create-leave-form";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, FileText, Clock } from "lucide-react";
import Link from "next/link";
import { LeaveType, LeaveBalance } from "@/types/leave";

// Mock data for demonstration
const mockLeaveTypes: LeaveType[] = [
  {
    id: "1",
    name: "Annual Leave",
    description: "Yearly vacation days for rest and recreation",
    maxDaysPerYear: 25,
    color: "#3B82F6",
  },
  {
    id: "2",
    name: "Sick Leave",
    description: "Medical leave for illness or health-related issues",
    maxDaysPerYear: 10,
    color: "#EF4444",
  },
  {
    id: "3",
    name: "Personal Leave",
    description: "Personal time off for personal matters",
    maxDaysPerYear: 5,
    color: "#8B5CF6",
  },
  {
    id: "4",
    name: "Maternity Leave",
    description: "Leave for new mothers",
    maxDaysPerYear: 120,
    color: "#EC4899",
  },
  {
    id: "5",
    name: "Paternity Leave",
    description: "Leave for new fathers",
    maxDaysPerYear: 15,
    color: "#06B6D4",
  },
];

const mockLeaveBalances: LeaveBalance[] = [
  {
    id: "bal_1",
    employeeId: "emp_001",
    leaveTypeId: "1",
    leaveType: mockLeaveTypes[0],
    year: 2024,
    totalDays: 25,
    usedDays: 8,
    availableDays: 17,
    carriedOver: 2,
  },
  {
    id: "bal_2",
    employeeId: "emp_001",
    leaveTypeId: "2",
    leaveType: mockLeaveTypes[1],
    year: 2024,
    totalDays: 10,
    usedDays: 3,
    availableDays: 7,
    carriedOver: 0,
  },
  {
    id: "bal_3",
    employeeId: "emp_001",
    leaveTypeId: "3",
    leaveType: mockLeaveTypes[2],
    year: 2024,
    totalDays: 5,
    usedDays: 1,
    availableDays: 4,
    carriedOver: 0,
  },
  {
    id: "bal_4",
    employeeId: "emp_001",
    leaveTypeId: "4",
    leaveType: mockLeaveTypes[3],
    year: 2024,
    totalDays: 120,
    usedDays: 0,
    availableDays: 120,
    carriedOver: 0,
  },
  {
    id: "bal_5",
    employeeId: "emp_001",
    leaveTypeId: "5",
    leaveType: mockLeaveTypes[4],
    year: 2024,
    totalDays: 15,
    usedDays: 0,
    availableDays: 15,
    carriedOver: 0,
  },
];

export default function CreateLeavePage(): React.ReactElement {
  const handleSuccess = (): void => {
    // Optional: Add any additional success handling here
    // The form component will handle navigation automatically
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link
          href="/dashboard/leaves/my-leaves"
          className="flex items-center hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          My Leaves
        </Link>
        <span>/</span>
        <span className="text-gray-900">Create Request</span>
      </div>

      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Leave Request
          </h1>
          <p className="text-gray-600">
            Submit a new leave request. Please ensure all details are accurate
            before submitting.
          </p>
        </div>
      </div>

      {/* Guidelines Card */}
      <Card className="border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-3 text-lg font-medium text-blue-900">
          Before You Submit
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-start space-x-3">
            <Calendar className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">Plan Ahead</h4>
              <p className="text-sm text-blue-700">
                Submit requests at least 2 weeks in advance for better approval
                chances.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <FileText className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">Provide Details</h4>
              <p className="text-sm text-blue-700">
                Include a clear reason to help your manager understand your
                request.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Clock className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">Check Balance</h4>
              <p className="text-sm text-blue-700">
                Ensure you have sufficient leave balance before submitting.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Form */}
      <CreateLeaveForm
        leaveTypes={mockLeaveTypes}
        leaveBalances={mockLeaveBalances}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
