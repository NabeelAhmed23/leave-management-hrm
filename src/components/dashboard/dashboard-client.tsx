"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { formatRole } from "@/utils/format-role";
import { Card } from "@/components/ui/card";
import {
  useDashboardData,
  type DashboardStats,
  type TodayEvent,
} from "@/hooks/use-dashboard";
import { DashboardStatsCard } from "./dashboard-stats-card";
import { TodayEventsCard } from "./today-events-card";
import { PendingRequestsTable } from "./pending-requests-table";
import { Role } from "../../../generated/prisma";
import Link from "next/link";

// Helper components to reduce complexity
function WelcomeSection({
  userName,
}: {
  userName: string;
}): React.ReactElement {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Welcome back, {userName}!
      </h2>
      <p className="mt-2 text-gray-600">
        Here is an overview of your leave management dashboard.
      </p>
    </Card>
  );
}

function ManagerStatsGrid({
  stats,
  events,
}: {
  stats: { data: DashboardStats | undefined; isLoading: boolean };
  events: { data: TodayEvent[] | undefined; isLoading: boolean };
}): React.ReactElement {
  return (
    <>
      <DashboardStatsCard
        title="Present Today"
        value={stats.data?.presentEmployees ?? 0}
        color="text-green-600"
        isLoading={stats.isLoading}
      />
      <DashboardStatsCard
        title="Pending Approvals"
        value={stats.data?.pendingApprovals ?? 0}
        color="text-yellow-600"
        isLoading={stats.isLoading}
      />
      <DashboardStatsCard
        title="Employees on Leave"
        value={stats.data?.employeesOnLeave ?? 0}
        color="text-blue-600"
        isLoading={stats.isLoading}
      />
      <DashboardStatsCard
        title="Today's Events"
        value={events.data?.length ?? 0}
        color="text-purple-600"
        isLoading={events.isLoading}
      />
    </>
  );
}

function EmployeeStatsGrid({
  stats,
}: {
  stats: { data: DashboardStats | undefined; isLoading: boolean };
}): React.ReactElement {
  return (
    <>
      <DashboardStatsCard
        title="Available Leaves"
        value={`${stats.data?.availableLeaves ?? 0} days`}
        color="text-green-600"
        isLoading={stats.isLoading}
      />
      <DashboardStatsCard
        title="Pending Requests"
        value={stats.data?.pendingRequests ?? 0}
        color="text-yellow-600"
        isLoading={stats.isLoading}
      />
      <DashboardStatsCard
        title="Approved This Year"
        value={stats.data?.approvedRequests ?? 0}
        color="text-green-600"
        isLoading={stats.isLoading}
      />
      <DashboardStatsCard
        title="Used This Year"
        value={`${stats.data?.usedLeavesThisYear ?? 0} days`}
        color="text-blue-600"
        isLoading={stats.isLoading}
      />
    </>
  );
}

interface User {
  email: string;
  firstName: string;
  lastName: string;
  employee?: {
    role: Role;
    employeeNumber?: string;
  };
}

function AccountInformation({ user }: { user: User }): React.ReactElement {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-gray-500">Email</dt>
          <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Role</dt>
          <dd className="mt-1">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {user.employee?.role ? formatRole(user.employee.role) : "No Role"}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Full Name</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {user.firstName} {user.lastName}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Employee Number</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {user.employee?.employeeNumber ?? "N/A"}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function QuickActions(): React.ReactElement {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/leaves/create"
          className="rounded-lg border border-gray-300 p-4 text-left transition-colors hover:bg-gray-50"
        >
          <h4 className="font-medium text-gray-900">Request Leave</h4>
          <p className="mt-1 text-sm text-gray-500">
            Submit a new leave request
          </p>
        </Link>
        <Link
          href="/dashboard/calendar"
          className="rounded-lg border border-gray-300 p-4 text-left transition-colors hover:bg-gray-50"
        >
          <h4 className="font-medium text-gray-900">View Calendar</h4>
          <p className="mt-1 text-sm text-gray-500">Check team availability</p>
        </Link>
        <Link
          href="/dashboard/leaves/my-leaves"
          className="rounded-lg border border-gray-300 p-4 text-left transition-colors hover:bg-gray-50"
        >
          <h4 className="font-medium text-gray-900">Leave History</h4>
          <p className="mt-1 text-sm text-gray-500">View your past requests</p>
        </Link>
      </div>
    </Card>
  );
}

export function DashboardClient(): React.ReactElement | null {
  const { user } = useAuth();
  const { stats, events, pendingRequests } = useDashboardData();

  if (!user) {
    return null;
  }

  const isManagerOrAdmin =
    user.employee?.role === Role.MANAGER ||
    user.employee?.role === Role.HR_ADMIN;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <WelcomeSection userName={user.firstName} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isManagerOrAdmin ? (
          <ManagerStatsGrid stats={stats} events={events} />
        ) : (
          <EmployeeStatsGrid stats={stats} />
        )}
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardStatsCard
          title="Team on Leave"
          value={stats.data?.teamOnLeave ?? 0}
          color="text-purple-600"
          isLoading={stats.isLoading}
        />

        {!isManagerOrAdmin && (
          <DashboardStatsCard
            title="Rejected This Year"
            value={stats.data?.rejectedRequests ?? 0}
            color="text-red-600"
            isLoading={stats.isLoading}
          />
        )}

        {/* Today's Events Card */}
        <div className="lg:col-span-2">
          <TodayEventsCard
            events={events.data ?? []}
            isLoading={events.isLoading}
          />
        </div>
      </div>

      {/* Pending Requests Table */}
      <PendingRequestsTable
        requests={pendingRequests.data ?? []}
        isLoading={pendingRequests.isLoading}
        title={
          isManagerOrAdmin
            ? "Pending Approval Requests"
            : "Your Pending Leave Requests"
        }
      />

      {/* User Information */}
      <AccountInformation user={user} />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
