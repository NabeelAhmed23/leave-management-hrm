"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useLogoutMutation } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatRole } from "@/utils/format-role";

export function DashboardClient(): React.ReactElement {
  const { user, isLoading } = useAuth();
  const logoutMutation = useLogoutMutation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to Leave Management System
          </h1>
          <p className="text-gray-600">Please sign in to access your account</p>
          <Button onClick={() => (window.location.href = "/login")}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Leave Management System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.firstName} {user.lastName}
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {user.employee?.role
                  ? formatRole(user.employee.role)
                  : "No Role"}
              </span>
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Signing out...
                  </>
                ) : (
                  "Sign Out"
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex h-96 items-center justify-center rounded-lg border-4 border-dashed border-gray-200">
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600">
                Welcome to your leave management dashboard. This is where your
                main application content will go.
              </p>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="font-medium text-gray-900">User Information</h3>
                <dl className="mt-2 text-sm text-gray-600">
                  <dt className="inline">Email: </dt>
                  <dd className="inline">{user.email}</dd>
                  <br />
                  <dt className="inline">Role: </dt>
                  <dd className="inline">
                    {user.employee?.role
                      ? formatRole(user.employee.role)
                      : "No Role"}
                  </dd>
                  <br />
                  <dt className="inline">User ID: </dt>
                  <dd className="inline">{user.id}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
