"use client";

import { useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import { useCalendarLeaves, CalendarViewType } from "@/hooks/use-calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

export function LeaveCalendar(): React.ReactElement {
  const [viewType, setViewType] = useState<CalendarViewType>("TEAM");
  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    employeeName: string;
    leaveType: string;
    department?: string;
    reason?: string;
    status: string;
  } | null>(null);
  const [dateRange, setDateRange] = useState<{
    start?: string;
    end?: string;
  }>({
    start: moment().subtract(1, "month").startOf("month").toISOString(),
    end: moment().add(1, "month").endOf("month").toISOString(),
  });

  // Fetch calendar data
  const {
    data: events = [],
    isFetching,
    error,
  } = useCalendarLeaves({
    type: viewType,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Convert events to FullCalendar format
  const calendarEvents = useMemo(() => {
    if (!events) return [];

    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      backgroundColor: event.color,
      borderColor: event.color,
      extendedProps: {
        employeeName: event.employeeName,
        employeeId: event.employeeId,
        leaveType: event.leaveType,
        leaveTypeId: event.leaveTypeId,
        department: event.department,
        reason: event.reason,
        status: event.status,
      },
    }));
  }, [events]);

  // Handle date range change
  const handleDatesSet = (arg: DatesSetArg) => {
    setDateRange({
      start: arg.startStr,
      end: arg.endStr,
    });
  };

  // Handle event click
  const handleEventClick = (info: EventClickArg) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start || new Date(),
      end: event.end || new Date(),
      employeeName: event.extendedProps.employeeName,
      leaveType: event.extendedProps.leaveType,
      department: event.extendedProps.department,
      reason: event.extendedProps.reason,
      status: event.extendedProps.status,
    });
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">Error loading calendar</p>
          <p className="mt-2 text-sm">{error.message}</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leave Calendar</h2>
        <div className="flex gap-2">
          <Button
            variant={viewType === "SELF" ? "default" : "outline"}
            onClick={() => setViewType("SELF")}
          >
            My Leaves
          </Button>
          <Button
            variant={viewType === "TEAM" ? "default" : "outline"}
            onClick={() => setViewType("TEAM")}
          >
            Team Leaves
          </Button>
        </div>
      </div>

      <div className="calendar-container relative">
        {isFetching && (
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm shadow-md">
              <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
            </div>
          </div>
        )}
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          height="auto"
          eventDisplay="block"
          displayEventTime={false}
          eventMaxStack={3}
          dayMaxEvents={true}
          moreLinkClick="popover"
          firstDay={1} // Start week on Monday
        />
      </div>

      <div className="mt-6 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-green-500"></div>
          <span>Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-amber-500"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-500"></div>
          <span>Rejected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-500"></div>
          <span>Cancelled</span>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Details</DialogTitle>
            <DialogDescription>
              View details of the selected leave request
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Employee
                </p>
                <p className="text-base">{selectedEvent.employeeName}</p>
              </div>

              {selectedEvent.department && (
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Department
                  </p>
                  <p className="text-base">{selectedEvent.department}</p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Leave Type
                </p>
                <p className="text-base">{selectedEvent.leaveType}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Status
                </p>
                <Badge
                  variant={
                    selectedEvent.status === "APPROVED"
                      ? "default"
                      : selectedEvent.status === "PENDING"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {selectedEvent.status}
                </Badge>
              </div>

              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Date Range
                </p>
                <p className="text-base">
                  {format(selectedEvent.start, "MMM dd, yyyy")} -{" "}
                  {format(selectedEvent.end, "MMM dd, yyyy")}
                </p>
              </div>

              {selectedEvent.reason && (
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Reason
                  </p>
                  <p className="text-base">{selectedEvent.reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>
        {`
          .fc-col-header-cell.fc-day{
            padding: 8px;
            font-weight: 400;
          }
        `}
      </style>
    </>
  );
}
