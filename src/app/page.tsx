import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function HomePage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
