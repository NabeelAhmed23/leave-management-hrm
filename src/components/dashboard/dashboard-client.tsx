"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { formatRole } from "@/utils/format-role";

export function DashboardClient(): React.ReactElement | null {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.firstName}!
        </h2>
        <p className="mt-2 text-gray-600">
          Here is an overview of your leave management dashboard.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Available Leave</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">12 days</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">
            Pending Requests
          </h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">2</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Used This Year</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">8 days</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Team on Leave</h3>
          <p className="mt-2 text-3xl font-bold text-purple-600">3</p>
        </div>
      </div>

      {/* User Information */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">
          Account Information
        </h3>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Role</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {user.employee?.role
                  ? formatRole(user.employee.role)
                  : "No Role"}
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
            <dt className="text-sm font-medium text-gray-500">User ID</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
          </div>
        </dl>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button className="rounded-lg border border-gray-300 p-4 text-left hover:bg-gray-50">
            <h4 className="font-medium text-gray-900">Request Leave</h4>
            <p className="mt-1 text-sm text-gray-500">
              Submit a new leave request
            </p>
          </button>
          <button className="rounded-lg border border-gray-300 p-4 text-left hover:bg-gray-50">
            <h4 className="font-medium text-gray-900">View Calendar</h4>
            <p className="mt-1 text-sm text-gray-500">
              Check team availability
            </p>
          </button>
          <button className="rounded-lg border border-gray-300 p-4 text-left hover:bg-gray-50">
            <h4 className="font-medium text-gray-900">Leave History</h4>
            <p className="mt-1 text-sm text-gray-500">
              View your past requests
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
