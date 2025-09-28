"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveTypesTab } from "@/components/settings/leave-types-tab";
import { GeneralTab } from "@/components/settings/general-tab";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage(): React.ReactElement {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Check authorization
  useEffect(() => {
    if (!isLoading && user) {
      const userRole = user.employee?.role;
      if (!userRole || !["HR_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
        router.replace("/dashboard");
        return;
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRole = user?.employee?.role;
  if (!userRole || !["HR_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-center text-gray-600">
          You don&apos;t have permission to access this page. Only HR
          Administrators and Super Administrators can access settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your organization&apos;s leave management configuration
        </p>
      </div>

      <Tabs defaultValue="leave-types" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leave-types">Leave Types</TabsTrigger>
          <TabsTrigger value="holidays" disabled>
            Holidays
          </TabsTrigger>
          <TabsTrigger value="policies" disabled>
            Policies
          </TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="leave-types">
          <LeaveTypesTab />
        </TabsContent>

        <TabsContent value="holidays">
          <Card>
            <CardHeader>
              <CardTitle>Holiday Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Holiday management functionality will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Leave Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Leave policy management functionality will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
