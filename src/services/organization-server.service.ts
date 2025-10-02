import { prisma } from "@/lib/prisma";
import { logger } from "@/services/logger.service";
import { AppError } from "@/utils/app-error";
import { Role, LeaveStatus } from "@prisma/client";
import {
  UpdateOrganizationDTO,
  GetOrganizationStatsDTO,
  DetailedOrganization,
  OrganizationStats,
} from "@/types/organization.types";

// Prisma include for detailed organization
const organizationInclude = {
  _count: {
    select: {
      employees: true,
      departments: true,
      leaveTypes: true,
      leavePolicies: true,
      holidays: true,
    },
  },
} as const;

/**
 * Verify user has permission to manage organization
 */
function verifyOrganizationPermission(userRole: Role): void {
  if (userRole !== Role.HR_ADMIN && userRole !== Role.SUPER_ADMIN) {
    throw new AppError("Insufficient permissions to manage organization", 403);
  }
}

/**
 * Get organization details by ID
 */
export async function getOrganization(
  organizationId: string
): Promise<DetailedOrganization> {
  try {
    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      include: organizationInclude,
    });

    if (!organization) {
      throw new AppError("Organization not found", 404);
    }

    logger.info(`Retrieved organization: ${organizationId}`);

    return organization as DetailedOrganization;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Get organization error: ${error}`);
    throw new AppError("Failed to retrieve organization", 500);
  }
}

/**
 * Update organization information
 */
export async function updateOrganization(
  organizationId: string,
  userRole: Role,
  data: UpdateOrganizationDTO
): Promise<DetailedOrganization> {
  try {
    // Verify permissions
    verifyOrganizationPermission(userRole);

    const { name, domain, carryOverDays, leaveRefreshDate, settings } = data;

    // Check if organization exists
    const existingOrganization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!existingOrganization) {
      throw new AppError("Organization not found", 404);
    }

    // Check if domain is being changed and conflicts with existing organization
    if (domain && domain !== existingOrganization.domain) {
      const conflictingOrganization = await prisma.organization.findFirst({
        where: {
          domain,
          id: {
            not: organizationId,
          },
        },
      });

      if (conflictingOrganization) {
        throw new AppError(
          "An organization with this domain already exists",
          400
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (domain !== undefined) {
      updateData.domain = domain.trim().toLowerCase();
    }

    if (carryOverDays !== undefined) {
      updateData.carryOverDays = carryOverDays;
    }

    if (leaveRefreshDate !== undefined) {
      updateData.leaveRefreshDate = leaveRefreshDate;
    }

    if (settings !== undefined) {
      // Merge with existing settings if they exist
      const currentSettings =
        (existingOrganization.settings as Record<string, unknown>) || {};
      updateData.settings = {
        ...currentSettings,
        ...settings,
      };
    }

    // Update the organization
    const updatedOrganization = await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: updateData,
      include: organizationInclude,
    });

    logger.info(`Organization updated: ${organizationId}`);

    return updatedOrganization as DetailedOrganization;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Update organization error: ${error}`);
    throw new AppError("Failed to update organization", 500);
  }
}

/**
 * Get organization statistics
 */
export async function getOrganizationStats(
  organizationId: string,
  query: GetOrganizationStatsDTO = {}
): Promise<OrganizationStats> {
  try {
    const { includeInactive = false } = query;

    // Get employee statistics
    const employeeStats = await prisma.employee.groupBy({
      by: ["role", "isActive"],
      where: {
        organizationId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      _count: true,
    });

    const totalEmployees = employeeStats.reduce(
      (sum, stat) => sum + stat._count,
      0
    );
    const activeEmployees = employeeStats
      .filter(stat => stat.isActive)
      .reduce((sum, stat) => sum + stat._count, 0);
    const inactiveEmployees = totalEmployees - activeEmployees;

    const employeesByRole = {
      EMPLOYEE: 0,
      MANAGER: 0,
      HR_ADMIN: 0,
      SUPER_ADMIN: 0,
    };

    employeeStats.forEach(stat => {
      if (stat.isActive || includeInactive) {
        employeesByRole[stat.role as keyof typeof employeesByRole] +=
          stat._count;
      }
    });

    // Get employees by department
    const employeesByDepartment = await prisma.department.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            employees: {
              where: includeInactive ? {} : { isActive: true },
            },
          },
        },
      },
    });

    // Get department statistics
    const departmentStats = await prisma.department.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        managerId: true,
      },
    });

    const totalDepartments = departmentStats.length;
    const departmentsWithManager = departmentStats.filter(
      dept => dept.managerId
    ).length;

    // Get leave statistics
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const startOfYear = new Date(currentYear, 0, 1);
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const [
      leaveTypesCount,
      leavePoliciesCount,
      totalLeaveRequests,
      pendingLeaveRequests,
      approvedLeaveRequests,
      rejectedLeaveRequests,
      cancelledLeaveRequests,
      thisMonthRequests,
      thisYearRequests,
      thisYearApprovedDays,
    ] = await Promise.all([
      prisma.leaveType.count({
        where: { organizationId },
      }),
      prisma.leavePolicy.count({
        where: { organizationId },
      }),
      prisma.leaveRequest.count({
        where: {
          employees: {
            some: {
              employee: { organizationId },
            },
          },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          employees: {
            some: {
              employee: { organizationId },
            },
          },
          status: LeaveStatus.PENDING,
        },
      }),
      prisma.leaveRequest.count({
        where: {
          employees: {
            some: {
              employee: { organizationId },
            },
          },
          status: LeaveStatus.APPROVED,
        },
      }),
      prisma.leaveRequest.count({
        where: {
          employees: {
            some: {
              employee: { organizationId },
            },
          },
          status: LeaveStatus.REJECTED,
        },
      }),
      prisma.leaveRequest.count({
        where: {
          employees: {
            some: {
              employee: { organizationId },
            },
          },
          status: LeaveStatus.CANCELLED,
        },
      }),
      prisma.leaveRequest.groupBy({
        by: ["status"],
        where: {
          employees: {
            some: {
              employee: { organizationId },
            },
          },
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _count: true,
      }),
      prisma.leaveRequest.groupBy({
        by: ["status"],
        where: {
          employees: {
            some: {
              employee: { organizationId },
            },
          },
          createdAt: {
            gte: startOfYear,
          },
        },
        _count: true,
      }),
      prisma.leaveRequest.aggregate({
        where: {
          employees: {
            some: {
              employee: { organizationId },
            },
          },
          status: LeaveStatus.APPROVED,
          startDate: {
            gte: startOfYear,
          },
        },
        _sum: {
          totalDays: true,
        },
      }),
    ]);

    // Process monthly stats
    const monthlyStats = {
      submitted: 0,
      approved: 0,
      rejected: 0,
    };

    thisMonthRequests.forEach(stat => {
      const count = (stat._count as { _all?: number })?._all || 0;
      switch (stat.status) {
        case LeaveStatus.PENDING:
        case LeaveStatus.APPROVED:
        case LeaveStatus.REJECTED:
        case LeaveStatus.CANCELLED:
          monthlyStats.submitted += count;
          break;
      }
      if (stat.status === LeaveStatus.APPROVED) {
        monthlyStats.approved += count;
      } else if (stat.status === LeaveStatus.REJECTED) {
        monthlyStats.rejected += count;
      }
    });

    // Process yearly stats
    const yearlyStats = {
      submitted: 0,
      approved: 0,
      rejected: 0,
    };

    thisYearRequests.forEach(stat => {
      const count = (stat._count as { _all?: number })?._all || 0;
      switch (stat.status) {
        case LeaveStatus.PENDING:
        case LeaveStatus.APPROVED:
        case LeaveStatus.REJECTED:
        case LeaveStatus.CANCELLED:
          yearlyStats.submitted += count;
          break;
      }
      if (stat.status === LeaveStatus.APPROVED) {
        yearlyStats.approved += count;
      } else if (stat.status === LeaveStatus.REJECTED) {
        yearlyStats.rejected += count;
      }
    });

    // Get holiday statistics
    const [totalHolidays, thisYearHolidays, recurringHolidays] =
      await Promise.all([
        prisma.holiday.count({
          where: { organizationId },
        }),
        prisma.holiday.count({
          where: {
            organizationId,
            date: {
              gte: startOfYear,
              lt: new Date(currentYear + 1, 0, 1),
            },
          },
        }),
        prisma.holiday.count({
          where: {
            organizationId,
            isRecurring: true,
          },
        }),
      ]);

    const stats: OrganizationStats = {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
        byRole: employeesByRole,
        byDepartment: employeesByDepartment.map(dept => ({
          departmentId: dept.id,
          departmentName: dept.name,
          count: dept._count.employees,
        })),
      },
      departments: {
        total: totalDepartments,
        withManager: departmentsWithManager,
        withoutManager: totalDepartments - departmentsWithManager,
      },
      leaves: {
        types: leaveTypesCount,
        policies: leavePoliciesCount,
        requests: {
          total: totalLeaveRequests,
          pending: pendingLeaveRequests,
          approved: approvedLeaveRequests,
          rejected: rejectedLeaveRequests,
          cancelled: cancelledLeaveRequests,
        },
        thisMonth: monthlyStats,
        thisYear: {
          ...yearlyStats,
          totalDaysTaken: thisYearApprovedDays._sum?.totalDays || 0,
        },
      },
      holidays: {
        total: totalHolidays,
        thisYear: thisYearHolidays,
        recurring: recurringHolidays,
      },
    };

    logger.info(`Retrieved organization statistics for: ${organizationId}`);

    return stats;
  } catch (error) {
    logger.error(`Get organization stats error: ${error}`);
    throw new AppError("Failed to retrieve organization statistics", 500);
  }
}
