"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LeaveStatus } from "@prisma/client";
import { QueryLeavesDTO } from "@/types/leave.types";

// Simple leave type interface for compatibility
interface SimpleLeaveType {
  id: string;
  name: string;
  description?: string | null;
  maxDaysPerYear: number;
}
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LeaveFiltersProps {
  filters: QueryLeavesDTO;
  onFiltersChange: (filters: QueryLeavesDTO) => void;
  leaveTypes: SimpleLeaveType[];
}

export function LeaveFilters({
  filters,
  onFiltersChange,
  leaveTypes,
}: LeaveFiltersProps): React.ReactElement {
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  );

  const handleStatusChange = (value: string): void => {
    const status = value === "ALL" ? undefined : (value as LeaveStatus);
    onFiltersChange({ ...filters, status });
  };

  const handleLeaveTypeChange = (value: string): void => {
    const leaveTypeId = value === "ALL" ? undefined : value;
    onFiltersChange({ ...filters, leaveTypeId });
  };

  const handleStartDateChange = (date: Date | undefined): void => {
    setStartDate(date);
    onFiltersChange({
      ...filters,
      startDate: date,
    });
  };

  const handleEndDateChange = (date: Date | undefined): void => {
    setEndDate(date);
    onFiltersChange({
      ...filters,
      endDate: date,
    });
  };

  const clearFilters = (): void => {
    setStartDate(undefined);
    setEndDate(undefined);
    onFiltersChange({
      page: 1,
      limit: filters.limit || 10,
      status: undefined,
      leaveTypeId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const hasActiveFilters =
    filters.status ||
    filters.leaveTypeId ||
    filters.startDate ||
    filters.endDate;

  return (
    <Card className="p-4">
      <div className="flex flex-col flex-wrap space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <Select
            value={filters.status ? filters.status : "ALL"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value={LeaveStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={LeaveStatus.APPROVED}>Approved</SelectItem>
              <SelectItem value={LeaveStatus.REJECTED}>Rejected</SelectItem>
              <SelectItem value={LeaveStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Leave Type
          </label>
          <Select
            value={filters.leaveTypeId || "ALL"}
            onValueChange={handleLeaveTypeChange}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {leaveTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Start Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal md:w-[200px]",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateChange}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">End Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal md:w-[200px]",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateChange}
                disabled={date => (startDate ? date < startDate : false)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-col justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="mt-7 w-full md:w-auto"
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
