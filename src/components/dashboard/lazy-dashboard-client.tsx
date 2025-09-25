"use client";

import dynamic from "next/dynamic";

// Lazy load the dashboard client with client-side rendering
const DashboardClient = dynamic(
  () =>
    import("@/components/dashboard/dashboard-client").then(mod => ({
      default: mod.DashboardClient,
    })),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    ),
    ssr: false,
  }
);

export function LazyDashboardClient(): React.ReactElement {
  return <DashboardClient />;
}
