import { Suspense } from "react";
import { LeaveCalendar } from "@/components/calendar/leave-calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CalendarPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </Card>
      }
    >
      <LeaveCalendar />
    </Suspense>
  );
}
