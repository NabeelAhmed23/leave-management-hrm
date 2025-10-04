"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeaveStatusBadge } from "./leave-status-badge";
import { DetailedLeaveRequest } from "@/types/leave.types";
import { format } from "date-fns";
import { Calendar, Clock, User, FileText, MessageSquare } from "lucide-react";

interface LeaveDetailViewProps {
  leaveRequest: DetailedLeaveRequest;
}

export function LeaveDetailView({
  leaveRequest,
}: LeaveDetailViewProps): React.ReactElement {
  const employee = leaveRequest.employees[0]?.employee;
  const employeeName = employee
    ? `${employee.user.firstName} ${employee.user.lastName}`
    : "Unknown Employee";
  const approver = leaveRequest.approvedBy;
  const rejector = leaveRequest.rejectedBy;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">
                Leave Request #{leaveRequest.id.slice(-6).toUpperCase()}
              </h2>
              <LeaveStatusBadge status={leaveRequest.status} />
            </div>
            <p className="mt-2 text-gray-600">
              Submitted on{" "}
              {format(new Date(leaveRequest.createdAt), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
      </Card>

      {/* Employee Information */}
      <Card className="p-6">
        <div className="mb-4 flex items-center space-x-2">
          <User className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Employee Information
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-600">Name</p>
            <p className="mt-1 text-gray-900">{employeeName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Employee Number</p>
            <p className="mt-1 text-gray-900">
              {employee?.employeeNumber || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Department</p>
            <p className="mt-1 text-gray-900">
              {employee?.department?.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Email</p>
            <p className="mt-1 text-gray-900">{employee?.user.email || "—"}</p>
          </div>
        </div>
      </Card>

      {/* Leave Details */}
      <Card className="p-6">
        <div className="mb-4 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Leave Details</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-600">Leave Type</p>
            <div className="mt-1 flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-gray-900">
                {leaveRequest.leaveType.name}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Days</p>
            <div className="mt-1">
              <Badge variant="outline" className="text-base">
                {leaveRequest.totalDays}{" "}
                {leaveRequest.totalDays === 1 ? "day" : "days"}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Start Date</p>
            <p className="mt-1 text-gray-900">
              {format(new Date(leaveRequest.startDate), "EEEE, MMM dd, yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">End Date</p>
            <p className="mt-1 text-gray-900">
              {format(new Date(leaveRequest.endDate), "EEEE, MMM dd, yyyy")}
            </p>
          </div>
        </div>
      </Card>

      {/* Reason */}
      {leaveRequest.reason && (
        <Card className="p-6">
          <div className="mb-4 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Reason</h3>
          </div>
          <p className="text-gray-700">{leaveRequest.reason}</p>
        </Card>
      )}

      {/* Approval/Rejection Information */}
      {(approver || rejector) && (
        <Card className="p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {approver ? "Approval" : "Rejection"} Information
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {approver ? "Approved" : "Rejected"} By
              </p>
              <p className="mt-1 text-gray-900">
                {approver
                  ? `${approver.user.firstName} ${approver.user.lastName}`
                  : rejector
                    ? `${rejector.user.firstName} ${rejector.user.lastName}`
                    : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Date</p>
              <p className="mt-1 text-gray-900">
                {leaveRequest.approvedAt
                  ? format(
                      new Date(leaveRequest.approvedAt),
                      "MMM dd, yyyy 'at' hh:mm a"
                    )
                  : leaveRequest.rejectedAt
                    ? format(
                        new Date(leaveRequest.rejectedAt),
                        "MMM dd, yyyy 'at' hh:mm a"
                      )
                    : "—"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Comments */}
      {leaveRequest.leaveComments && leaveRequest.leaveComments.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
          </div>
          <div className="space-y-4">
            {leaveRequest.leaveComments.map(comment => (
              <div
                key={comment.id}
                className="rounded-lg border bg-gray-50 p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {comment.employee.user.firstName}{" "}
                      {comment.employee.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(
                        new Date(comment.createdAt),
                        "MMM dd, yyyy 'at' hh:mm a"
                      )}
                    </p>
                  </div>
                  {comment.isInternal && (
                    <Badge
                      variant="outline"
                      className="border-gray-600 text-gray-600"
                    >
                      Internal
                    </Badge>
                  )}
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Metadata</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-600">Created At</p>
            <p className="mt-1 text-gray-900">
              {format(
                new Date(leaveRequest.createdAt),
                "MMM dd, yyyy 'at' hh:mm a"
              )}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Last Updated</p>
            <p className="mt-1 text-gray-900">
              {format(
                new Date(leaveRequest.updatedAt),
                "MMM dd, yyyy 'at' hh:mm a"
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
