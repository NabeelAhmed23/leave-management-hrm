import { Badge } from "@/components/ui/badge";
import { LeaveStatus } from "@/types/leave";
import { cn } from "@/lib/utils";

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
  className?: string;
}

export function LeaveStatusBadge({
  status,
  className,
}: LeaveStatusBadgeProps): React.ReactElement {
  const getStatusConfig = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.PENDING:
        return {
          label: "Pending",
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        };
      case LeaveStatus.APPROVED:
        return {
          label: "Approved",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 hover:bg-green-100",
        };
      case LeaveStatus.REJECTED:
        return {
          label: "Rejected",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 hover:bg-red-100",
        };
      case LeaveStatus.CANCELLED:
        return {
          label: "Cancelled",
          variant: "outline" as const,
          className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
        };
      default:
        return {
          label: status,
          variant: "secondary" as const,
          className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
