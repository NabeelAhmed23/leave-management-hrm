import { prisma } from "@/lib/prisma";
import { logger } from "@/services/logger.service";
import { AppError } from "@/utils/app-error";
import { LeaveStatus } from "../../generated/prisma";

// Types for calendar events
export interface CalendarLeaveEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: LeaveStatus;
  employeeName: string;
  employeeId: string;
  leaveType: string;
  leaveTypeId: string;
  color: string;
  reason?: string;
  department?: string;
}

/**
 * Get color based on leave status
 */
function getColorByStatus(status: LeaveStatus): string {
  switch (status) {
    case LeaveStatus.APPROVED:
      return "#22c55e"; // green
    case LeaveStatus.PENDING:
      return "#f59e0b"; // amber
    case LeaveStatus.REJECTED:
      return "#ef4444"; // red
    case LeaveStatus.CANCELLED:
      return "#6b7280"; // gray
    default:
      return "#3b82f6"; // blue
  }
}

/**
 * Get leave events for the authenticated user (SELF view)
 */
export async function getSelfLeaveEvents(
  employeeId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CalendarLeaveEvent[]> {
  try {
    logger.info("Fetching self leave events", {
      employeeId,
      startDate,
      endDate,
    });

    const whereClause: {
      employees: { some: { employeeId: string } };
      status: LeaveStatus;
      startDate?: { gte: Date };
      endDate?: { lte: Date };
    } = {
      employees: {
        some: {
          employeeId,
        },
      },
      status: LeaveStatus.APPROVED, // Only show approved leaves on calendar
    };

    // Add date filters if provided
    if (startDate) {
      whereClause.startDate = { gte: startDate };
    }
    if (endDate) {
      whereClause.endDate = { lte: endDate };
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        leaveType: true,
        employees: {
          include: {
            employee: {
              include: {
                user: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    const events: CalendarLeaveEvent[] = leaveRequests.map(request => {
      const employee = request.employees[0]?.employee;
      const employeeName = employee?.user
        ? `${employee.user.firstName} ${employee.user.lastName}`
        : "Unknown Employee";

      return {
        id: request.id,
        title: `${request.leaveType.name}`,
        start: request.startDate,
        end: request.endDate,
        status: request.status,
        employeeName,
        employeeId: employee?.id || "",
        leaveType: request.leaveType.name,
        leaveTypeId: request.leaveType.id,
        color: getColorByStatus(request.status),
        reason: request.reason || undefined,
        department: employee?.department?.name,
      };
    });

    logger.info("Successfully fetched self leave events", {
      employeeId,
      eventCount: events.length,
    });

    return events;
  } catch (error) {
    logger.error("Error fetching self leave events", {
      error: error as Error,
      employeeId,
    });
    throw AppError.from(error);
  }
}

/**
 * Get leave events for all employees in the organization (TEAM view)
 */
export async function getTeamLeaveEvents(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CalendarLeaveEvent[]> {
  try {
    logger.info("Fetching team leave events", {
      organizationId,
      startDate,
      endDate,
    });

    const whereClause: {
      employees: {
        some: {
          employee: {
            organizationId: string;
            isActive: boolean;
          };
        };
      };
      status: LeaveStatus;
      startDate?: { gte: Date };
      endDate?: { lte: Date };
    } = {
      employees: {
        some: {
          employee: {
            organizationId,
            isActive: true,
          },
        },
      },
      status: LeaveStatus.APPROVED, // Only show approved leaves on calendar
    };

    // Add date filters if provided
    if (startDate) {
      whereClause.startDate = { gte: startDate };
    }
    if (endDate) {
      whereClause.endDate = { lte: endDate };
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        leaveType: true,
        employees: {
          include: {
            employee: {
              include: {
                user: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    const events: CalendarLeaveEvent[] = leaveRequests.map(request => {
      const employee = request.employees[0]?.employee;
      const employeeName = employee?.user
        ? `${employee.user.firstName} ${employee.user.lastName}`
        : "Unknown Employee";

      return {
        id: request.id,
        title: `${employeeName} - ${request.leaveType.name}`,
        start: request.startDate,
        end: request.endDate,
        status: request.status,
        employeeName,
        employeeId: employee?.id || "",
        leaveType: request.leaveType.name,
        leaveTypeId: request.leaveType.id,
        color: getColorByStatus(request.status),
        reason: request.reason || undefined,
        department: employee?.department?.name,
      };
    });

    logger.info("Successfully fetched team leave events", {
      organizationId,
      eventCount: events.length,
    });

    return events;
  } catch (error) {
    logger.error("Error fetching team leave events", {
      error: error as Error,
      organizationId,
    });
    throw AppError.from(error);
  }
}
