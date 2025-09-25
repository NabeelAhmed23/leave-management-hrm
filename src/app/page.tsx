import dynamic from "next/dynamic";
import { Suspense } from "react";

// Lazy load the dashboard client component
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
