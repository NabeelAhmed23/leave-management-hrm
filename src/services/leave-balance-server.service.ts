import { prisma } from "@/lib/prisma";
import { logger } from "@/services/logger.service";
import { AppError } from "@/utils/app-error";
import { Role } from "@prisma/client";
import {
  CreateLeaveBalanceDTO,
  UpdateLeaveBalanceDTO,
  BulkAssignLeaveTypeDTO,
  QueryLeaveBalancesDTO,
  DetailedLeaveBalance,
  EmployeeWithLeaveBalances,
  BulkAssignmentResult,
} from "@/types/leave-balance.types";

// Prisma include for detailed leave balance
const leaveBalanceInclude = {
  employee: {
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  leaveType: {
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          domain: true,
        },
      },
    },
  },
} as const;

/**
 * Verify user has permission to manage leave balances
 */
function verifyLeaveBalancePermission(userRole: Role): void {
  if (userRole !== Role.HR_ADMIN && userRole !== Role.SUPER_ADMIN) {
    throw new AppError(
      "Insufficient permissions to manage leave balances",
      403
    );
  }
}

/**
 * Calculate available days based on total and used days
 */
function calculateAvailableDays(totalDays: number, usedDays: number): number {
  return Math.max(0, totalDays - usedDays);
}

/**
 * Assign a leave type to an employee (create or update leave balance)
 */
export async function assignLeaveTypeToEmployee(
  employeeId: string,
  organizationId: string,
  userRole: Role,
  data: CreateLeaveBalanceDTO
): Promise<DetailedLeaveBalance> {
  try {
    // Verify permissions
    verifyLeaveBalancePermission(userRole);

    const { leaveTypeId, year, totalDays, carriedOver = 0 } = data;

    // Verify employee exists and belongs to the organization
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
        isActive: true,
      },
    });

    if (!employee) {
      throw new AppError(
        "Employee not found or not active in this organization",
        404
      );
    }

    // Verify leave type exists and belongs to the organization
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        organizationId,
      },
    });

    if (!leaveType) {
      throw new AppError("Leave type not found in this organization", 404);
    }

    // Check if leave balance already exists for this employee, leave type, and year
    const existingBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId,
        leaveTypeId,
        year,
      },
    });

    let leaveBalance;

    if (existingBalance) {
      // Update existing balance
      const availableDays = calculateAvailableDays(
        totalDays,
        existingBalance.usedDays
      );

      leaveBalance = await prisma.leaveBalance.update({
        where: {
          id: existingBalance.id,
        },
        data: {
          totalDays,
          carriedOver,
          availableDays,
        },
        include: leaveBalanceInclude,
      });

      logger.info(
        `Leave balance updated: ${leaveBalance.id} for employee: ${employeeId}, leave type: ${leaveTypeId}, year: ${year}`
      );
    } else {
      // Create new balance
      const availableDays = calculateAvailableDays(totalDays, 0);

      leaveBalance = await prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveTypeId,
          year,
          totalDays,
          usedDays: 0,
          availableDays,
          carriedOver,
        },
        include: leaveBalanceInclude,
      });

      logger.info(
        `Leave balance created: ${leaveBalance.id} for employee: ${employeeId}, leave type: ${leaveTypeId}, year: ${year}`
      );
    }

    return leaveBalance as DetailedLeaveBalance;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Assign leave type to employee error: ${error}`);
    throw new AppError("Failed to assign leave type to employee", 500);
  }
}

/**
 * Get all leave balances for an employee
 */
export async function getEmployeeLeaveBalances(
  employeeId: string,
  organizationId: string,
  query: QueryLeaveBalancesDTO = {}
): Promise<EmployeeWithLeaveBalances> {
  try {
    const { year, leaveTypeId } = query;

    // Verify employee exists and belongs to the organization
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!employee) {
      throw new AppError("Employee not found in this organization", 404);
    }

    // Build where clause for leave balances
    const balanceWhere: Record<string, unknown> = {
      employeeId,
    };

    if (year) {
      balanceWhere.year = year;
    }

    if (leaveTypeId) {
      balanceWhere.leaveTypeId = leaveTypeId;
    }

    // Get leave balances
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: balanceWhere,
      include: {
        leaveType: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                domain: true,
              },
            },
          },
        },
      },
      orderBy: [{ year: "desc" }, { leaveType: { name: "asc" } }],
    });

    logger.info(
      `Retrieved ${leaveBalances.length} leave balances for employee: ${employeeId}`
    );

    return {
      ...employee,
      leaveBalances,
    } as EmployeeWithLeaveBalances;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Get employee leave balances error: ${error}`);
    throw new AppError("Failed to retrieve employee leave balances", 500);
  }
}

/**
 * Update an existing leave balance
 */
export async function updateLeaveBalance(
  leaveBalanceId: string,
  organizationId: string,
  userRole: Role,
  data: UpdateLeaveBalanceDTO
): Promise<DetailedLeaveBalance> {
  try {
    // Verify permissions
    verifyLeaveBalancePermission(userRole);

    const { totalDays, carriedOver } = data;

    // Verify leave balance exists and belongs to the organization
    const existingBalance = await prisma.leaveBalance.findFirst({
      where: {
        id: leaveBalanceId,
      },
      include: {
        employee: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (
      !existingBalance ||
      existingBalance.employee.organizationId !== organizationId
    ) {
      throw new AppError("Leave balance not found in this organization", 404);
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (totalDays !== undefined) {
      updateData.totalDays = totalDays;
      updateData.availableDays = calculateAvailableDays(
        totalDays,
        existingBalance.usedDays
      );
    }

    if (carriedOver !== undefined) {
      updateData.carriedOver = carriedOver;
    }

    // Update the leave balance
    const updatedBalance = await prisma.leaveBalance.update({
      where: {
        id: leaveBalanceId,
      },
      data: updateData,
      include: leaveBalanceInclude,
    });

    logger.info(
      `Leave balance updated: ${leaveBalanceId} in organization: ${organizationId}`
    );

    return updatedBalance as DetailedLeaveBalance;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Update leave balance error: ${error}`);
    throw new AppError("Failed to update leave balance", 500);
  }
}

/**
 * Delete a leave balance
 */
export async function deleteLeaveBalance(
  leaveBalanceId: string,
  organizationId: string,
  userRole: Role
): Promise<{ message: string }> {
  try {
    // Verify permissions
    verifyLeaveBalancePermission(userRole);

    // Verify leave balance exists and belongs to the organization
    const existingBalance = await prisma.leaveBalance.findFirst({
      where: {
        id: leaveBalanceId,
      },
      include: {
        employee: {
          select: {
            organizationId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        leaveType: {
          select: {
            name: true,
          },
        },
      },
    });

    if (
      !existingBalance ||
      existingBalance.employee.organizationId !== organizationId
    ) {
      throw new AppError("Leave balance not found in this organization", 404);
    }

    // Check if balance has been used
    if (existingBalance.usedDays > 0) {
      throw new AppError(
        "Cannot delete leave balance that has been partially used. Consider updating the allocation instead.",
        400,
        {
          usedDays: existingBalance.usedDays,
          totalDays: existingBalance.totalDays,
        }
      );
    }

    // Delete the leave balance
    await prisma.leaveBalance.delete({
      where: {
        id: leaveBalanceId,
      },
    });

    const employeeName = existingBalance.employee.user
      ? `${existingBalance.employee.user.firstName} ${existingBalance.employee.user.lastName}`
      : "Unknown Employee";

    logger.info(
      `Leave balance deleted: ${leaveBalanceId} (${existingBalance.leaveType.name}) for ${employeeName} in organization: ${organizationId}`
    );

    return {
      message: `Leave balance for ${existingBalance.leaveType.name} has been successfully removed from ${employeeName}`,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Delete leave balance error: ${error}`);
    throw new AppError("Failed to delete leave balance", 500);
  }
}

/**
 * Bulk assign leave type to multiple employees
 */
export async function bulkAssignLeaveType(
  organizationId: string,
  userRole: Role,
  data: BulkAssignLeaveTypeDTO
): Promise<BulkAssignmentResult> {
  try {
    // Verify permissions
    verifyLeaveBalancePermission(userRole);

    const { employeeIds, leaveTypeId, year, totalDays, carriedOver = 0 } = data;

    // Verify leave type exists and belongs to the organization
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        organizationId,
      },
    });

    if (!leaveType) {
      throw new AppError("Leave type not found in this organization", 404);
    }

    // Get all employees that exist in the organization
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        organizationId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const result: BulkAssignmentResult = {
      successful: [],
      failed: [],
      summary: {
        total: employeeIds.length,
        successful: 0,
        failed: 0,
      },
    };

    // Process each employee
    for (const employeeId of employeeIds) {
      try {
        const employee = employees.find(e => e.id === employeeId);

        if (!employee) {
          result.failed.push({
            employeeId,
            employeeName: "Unknown Employee",
            error: "Employee not found or not active in this organization",
          });
          continue;
        }

        const employeeName = employee.user
          ? `${employee.user.firstName} ${employee.user.lastName}`
          : "Unknown Employee";

        const leaveBalance = await assignLeaveTypeToEmployee(
          employeeId,
          organizationId,
          userRole,
          {
            leaveTypeId,
            year,
            totalDays,
            carriedOver,
          }
        );

        result.successful.push({
          employeeId,
          employeeName,
          leaveBalanceId: leaveBalance.id,
        });
      } catch (error) {
        const employee = employees.find(e => e.id === employeeId);
        const employeeName = employee
          ? employee.user
            ? `${employee.user.firstName} ${employee.user.lastName}`
            : "Unknown Employee"
          : "Unknown Employee";

        result.failed.push({
          employeeId,
          employeeName,
          error:
            error instanceof AppError
              ? error.message
              : "Unknown error occurred",
        });
      }
    }

    result.summary.successful = result.successful.length;
    result.summary.failed = result.failed.length;

    logger.info(
      `Bulk assignment completed: ${result.summary.successful} successful, ${result.summary.failed} failed for leave type: ${leaveTypeId}, year: ${year}`
    );

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Bulk assign leave type error: ${error}`);
    throw new AppError("Failed to bulk assign leave type", 500);
  }
}

/**
 * Get leave balance by ID
 */
export async function getLeaveBalanceById(
  leaveBalanceId: string,
  organizationId: string
): Promise<DetailedLeaveBalance> {
  try {
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        id: leaveBalanceId,
      },
      include: leaveBalanceInclude,
    });

    if (
      !leaveBalance ||
      leaveBalance.leaveType.organization.id !== organizationId
    ) {
      throw new AppError("Leave balance not found in this organization", 404);
    }

    logger.info(
      `Retrieved leave balance: ${leaveBalanceId} for organization: ${organizationId}`
    );

    return leaveBalance as DetailedLeaveBalance;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Get leave balance by ID error: ${error}`);
    throw new AppError("Failed to retrieve leave balance", 500);
  }
}
