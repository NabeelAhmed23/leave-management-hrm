import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

interface DashboardRootLayoutProps {
  children: React.ReactNode;
}

export default function DashboardRootLayout({
  children,
}: DashboardRootLayoutProps): React.ReactElement {
  return <DashboardLayout>{children}</DashboardLayout>;
}
