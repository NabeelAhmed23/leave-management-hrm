import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingLeaveRequest } from "@/hooks/use-dashboard";
import { format } from "date-fns";
import { Calendar, Clock, User } from "lucide-react";

interface PendingRequestsTableProps {
  requests: PendingLeaveRequest[];
  isLoading?: boolean;
  title?: string;
}

export function PendingRequestsTable({
  requests,
  isLoading = false,
  title = "Pending Leave Requests",
}: PendingRequestsTableProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900">{title}</h3>
        <div className="py-8 text-center">
          <Clock className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">No pending leave requests.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-medium text-gray-900">{title}</h3>

      <div className="space-y-4">
        {requests.map(request => (
          <div
            key={request.id}
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900">
                  {request.employeeName}
                </span>
                {request.department && (
                  <span className="text-sm text-gray-500">
                    • {request.department}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {format(request.createdAt, "MMM dd, yyyy")}
              </span>
            </div>

            <div className="mb-2 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(request.startDate, "MMM dd")} -{" "}
                  {format(request.endDate, "MMM dd, yyyy")}
                </span>
              </div>
              <span>• {request.totalDays} days</span>
              <span>• {request.leaveType}</span>
            </div>

            {request.reason && (
              <p className="mt-2 rounded bg-gray-50 p-2 text-sm text-gray-600">
                {request.reason}
              </p>
            )}
          </div>
        ))}
      </div>

      {requests.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
            View all requests ({requests.length})
          </button>
        </div>
      )}
    </Card>
  );
}
