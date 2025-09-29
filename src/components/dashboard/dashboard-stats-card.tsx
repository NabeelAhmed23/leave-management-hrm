import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsCardProps {
  title: string;
  value: string | number;
  color: string;
  isLoading?: boolean;
}

export function DashboardStatsCard({
  title,
  value,
  color,
  isLoading = false,
}: DashboardStatsCardProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="h-8 w-16" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}
