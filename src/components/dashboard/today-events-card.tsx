import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TodayEvent } from "@/hooks/use-dashboard";
import { Calendar, Gift } from "lucide-react";

interface TodayEventsCardProps {
  events: TodayEvent[];
  isLoading?: boolean;
}

export function TodayEventsCard({
  events,
  isLoading = false,
}: TodayEventsCardProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Card>
    );
  }

  const birthdays = events.filter(event => event.type === "birthday");
  const anniversaries = events.filter(event => event.type === "anniversary");

  if (events.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Today&apos;s Events
        </h3>
        <p className="text-sm text-gray-500">
          No birthdays or work anniversaries today.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-medium text-gray-900">
        Today&apos;s Events
      </h3>

      <div className="space-y-4">
        {birthdays.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Gift className="h-4 w-4 text-pink-500" />
              <h4 className="font-medium text-gray-700">Birthdays</h4>
            </div>
            <div className="space-y-1">
              {birthdays.map(event => (
                <div key={event.id} className="text-sm text-gray-600">
                  <span className="font-medium">{event.employeeName}</span>
                  {event.department && (
                    <span className="text-gray-400"> • {event.department}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {anniversaries.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <h4 className="font-medium text-gray-700">Work Anniversaries</h4>
            </div>
            <div className="space-y-1">
              {anniversaries.map(event => (
                <div key={event.id} className="text-sm text-gray-600">
                  <span className="font-medium">{event.employeeName}</span>
                  {event.yearsOfService && (
                    <span className="text-blue-600">
                      {" "}
                      • {event.yearsOfService} years
                    </span>
                  )}
                  {event.department && (
                    <span className="text-gray-400"> • {event.department}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
