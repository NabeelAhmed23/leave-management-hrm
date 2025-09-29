import { prisma } from "@/lib/prisma";
import { logger } from "@/services/logger.service";
import { AppError } from "@/utils/app-error";
import { LeaveStatus } from "../../generated/prisma";

// Types for dashboard statistics
export interface DashboardStats {
  availableLeaves: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  usedLeavesThisYear: number;
  teamOnLeave: number;
  presentEmployees?: number;
  pendingApprovals?: number;
  employeesOnLeave?: number;
}

export interface TodayEvent {
  id: string;
  type: "birthday" | "anniversary";
  employeeId: string;
  employeeName: string;
  department?: string;
  yearsOfService?: number;
  date: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  department?: string;
  isOnLeave: boolean;
  leaveType?: string;
  leaveEndDate?: Date;
}

export interface PendingLeaveRequest {
  id: string;
  employeeName: string;
  department?: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
  createdAt: Date;
}

/**
 * Get dashboard statistics for an employee
 */
export async function getEmployeeDashboardStats(
  employeeId: string,
  organizationId: string
): Promise<DashboardStats> {
  try {
    const currentYear = new Date().getFullYear();

    // Get employee's leave balances (available leaves)
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year: currentYear,
      },
      include: {
        leaveType: true,
      },
    });

    const availableLeaves = leaveBalances.reduce(
      (total, balance) => total + balance.availableDays,
      0
    );

    const usedLeavesThisYear = leaveBalances.reduce(
      (total, balance) => total + balance.usedDays,
      0
    );

    // Get leave requests by status
    const [pendingRequests, approvedRequests, rejectedRequests] =
      await Promise.all([
        prisma.leaveRequest.count({
          where: {
            employeeId,
            status: LeaveStatus.PENDING,
          },
        }),
        prisma.leaveRequest.count({
          where: {
            employeeId,
            status: LeaveStatus.APPROVED,
            startDate: {
              gte: new Date(`${currentYear}-01-01`),
              lte: new Date(`${currentYear}-12-31`),
            },
          },
        }),
        prisma.leaveRequest.count({
          where: {
            employeeId,
            status: LeaveStatus.REJECTED,
            startDate: {
              gte: new Date(`${currentYear}-01-01`),
              lte: new Date(`${currentYear}-12-31`),
            },
          },
        }),
      ]);

    // Get team members currently on leave
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const teamOnLeave = await prisma.leaveRequest.count({
      where: {
        employee: {
          organizationId,
        },
        status: LeaveStatus.APPROVED,
        startDate: {
          lte: today,
        },
        endDate: {
          gte: today,
        },
      },
    });

    logger.info("Retrieved employee dashboard stats", {
      employeeId,
      organizationId,
      availableLeaves,
      usedLeavesThisYear,
    });

    return {
      availableLeaves,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      usedLeavesThisYear,
      teamOnLeave,
    };
  } catch (error) {
    logger.error("Error retrieving employee dashboard stats", {
      error: error as Error,
      employeeId,
      organizationId,
    });
    throw AppError.from(error);
  }
}

/**
 * Get dashboard statistics for managers and admins
 */
export async function getManagerDashboardStats(
  organizationId: string
): Promise<DashboardStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total active employees
    const totalEmployees = await prisma.employee.count({
      where: {
        organizationId,
        isActive: true,
      },
    });

    // Get employees currently on leave
    const employeesOnLeave = await prisma.leaveRequest.count({
      where: {
        employee: {
          organizationId,
        },
        status: LeaveStatus.APPROVED,
        startDate: {
          lte: today,
        },
        endDate: {
          gte: today,
        },
      },
    });

    // Present employees = Total - On Leave
    const presentEmployees = totalEmployees - employeesOnLeave;

    // Get pending approval requests
    const pendingApprovals = await prisma.leaveRequest.count({
      where: {
        employee: {
          organizationId,
        },
        status: LeaveStatus.PENDING,
      },
    });

    logger.info("Retrieved manager dashboard stats", {
      organizationId,
      totalEmployees,
      presentEmployees,
      employeesOnLeave,
      pendingApprovals,
    });

    return {
      availableLeaves: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      usedLeavesThisYear: 0,
      teamOnLeave: 0,
      presentEmployees,
      pendingApprovals,
      employeesOnLeave,
    };
  } catch (error) {
    logger.error("Error retrieving manager dashboard stats", {
      error: error as Error,
      organizationId,
    });
    throw AppError.from(error);
  }
}

/**
 * Get today's events (birthdays and work anniversaries)
 */
export async function getTodayEvents(
  organizationId: string
): Promise<TodayEvent[]> {
  try {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const todayDate = today.getDate();

    const events: TodayEvent[] = [];

    // Get birthdays
    const birthdayEmployees = await prisma.employee.findMany({
      where: {
        organizationId,
        isActive: true,
        dateOfBirth: {
          not: null,
        },
      },
      include: {
        user: true,
        department: true,
      },
    });

    // Filter employees with birthdays today
    const todayBirthdays = birthdayEmployees.filter(employee => {
      if (!employee.dateOfBirth) return false;
      const birthDate = new Date(employee.dateOfBirth);
      return (
        birthDate.getMonth() + 1 === todayMonth &&
        birthDate.getDate() === todayDate
      );
    });

    // Add birthday events
    todayBirthdays.forEach(employee => {
      events.push({
        id: employee.id,
        type: "birthday",
        employeeId: employee.id,
        employeeName: employee.user
          ? `${employee.user.firstName} ${employee.user.lastName}`
          : "Unknown Employee",
        department: employee.department?.name,
        date: employee.dateOfBirth!,
      });
    });

    // Get work anniversaries
    const allEmployees = await prisma.employee.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        user: true,
        department: true,
      },
    });

    // Filter employees with work anniversaries today
    const todayAnniversaries = allEmployees.filter(employee => {
      const startDate = new Date(employee.startDate);
      return (
        startDate.getMonth() + 1 === todayMonth &&
        startDate.getDate() === todayDate &&
        startDate.getFullYear() < today.getFullYear()
      );
    });

    // Add anniversary events
    todayAnniversaries.forEach(employee => {
      const startDate = new Date(employee.startDate);
      const yearsOfService = today.getFullYear() - startDate.getFullYear();

      events.push({
        id: employee.id,
        type: "anniversary",
        employeeId: employee.id,
        employeeName: employee.user
          ? `${employee.user.firstName} ${employee.user.lastName}`
          : "Unknown Employee",
        department: employee.department?.name,
        yearsOfService,
        date: employee.startDate,
      });
    });

    logger.info("Retrieved today's events", {
      organizationId,
      birthdaysCount: todayBirthdays.length,
      anniversariesCount: todayAnniversaries.length,
    });

    return events;
  } catch (error) {
    logger.error("Error retrieving today's events", {
      error: error as Error,
      organizationId,
    });
    throw AppError.from(error);
  }
}

/**
 * Get team status (who's present/on leave)
 */
export async function getTeamStatus(
  organizationId: string
): Promise<TeamMember[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employees = await prisma.employee.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        user: true,
        department: true,
        leaveRequests: {
          where: {
            status: LeaveStatus.APPROVED,
            startDate: {
              lte: today,
            },
            endDate: {
              gte: today,
            },
          },
          include: {
            leaveType: true,
          },
        },
      },
    });

    const teamMembers: TeamMember[] = employees.map(employee => {
      const currentLeave = employee.leaveRequests[0]; // Should only be one active leave

      return {
        id: employee.id,
        name: employee.user
          ? `${employee.user.firstName} ${employee.user.lastName}`
          : "Unknown Employee",
        department: employee.department?.name,
        isOnLeave: !!currentLeave,
        leaveType: currentLeave?.leaveType?.name,
        leaveEndDate: currentLeave?.endDate,
      };
    });

    logger.info("Retrieved team status", {
      organizationId,
      totalMembers: teamMembers.length,
      onLeave: teamMembers.filter(m => m.isOnLeave).length,
    });

    return teamMembers;
  } catch (error) {
    logger.error("Error retrieving team status", {
      error: error as Error,
      organizationId,
    });
    throw AppError.from(error);
  }
}

/**
 * Get pending leave requests for employee dashboard
 */
export async function getEmployeePendingRequests(
  employeeId: string
): Promise<PendingLeaveRequest[]> {
  try {
    const pendingRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: LeaveStatus.PENDING,
      },
      include: {
        leaveType: true,
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedRequests: PendingLeaveRequest[] = pendingRequests.map(
      request => ({
        id: request.id,
        employeeName: request.employee.user
          ? `${request.employee.user.firstName} ${request.employee.user.lastName}`
          : "Unknown Employee",
        department: request.employee.department?.name,
        leaveType: request.leaveType.name,
        startDate: request.startDate,
        endDate: request.endDate,
        totalDays: request.totalDays,
        reason: request.reason || undefined,
        createdAt: request.createdAt,
      })
    );

    logger.info("Retrieved employee pending requests", {
      employeeId,
      count: formattedRequests.length,
    });

    return formattedRequests;
  } catch (error) {
    logger.error("Error retrieving employee pending requests", {
      error: error as Error,
      employeeId,
    });
    throw AppError.from(error);
  }
}

/**
 * Get all pending approval requests for managers
 */
export async function getAllPendingApprovalRequests(
  organizationId: string
): Promise<PendingLeaveRequest[]> {
  try {
    const pendingRequests = await prisma.leaveRequest.findMany({
      where: {
        employee: {
          organizationId,
        },
        status: LeaveStatus.PENDING,
      },
      include: {
        leaveType: true,
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedRequests: PendingLeaveRequest[] = pendingRequests.map(
      request => ({
        id: request.id,
        employeeName: request.employee.user
          ? `${request.employee.user.firstName} ${request.employee.user.lastName}`
          : "Unknown Employee",
        department: request.employee.department?.name,
        leaveType: request.leaveType.name,
        startDate: request.startDate,
        endDate: request.endDate,
        totalDays: request.totalDays,
        reason: request.reason || undefined,
        createdAt: request.createdAt,
      })
    );

    logger.info("Retrieved all pending approval requests", {
      organizationId,
      count: formattedRequests.length,
    });

    return formattedRequests;
  } catch (error) {
    logger.error("Error retrieving all pending approval requests", {
      error: error as Error,
      organizationId,
    });
    throw AppError.from(error);
  }
}
