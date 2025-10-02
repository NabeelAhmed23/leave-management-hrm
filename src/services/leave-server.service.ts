import { prisma } from "@/lib/prisma";
import { logger } from "@/services/logger.service";
import { AppError } from "@/utils/app-error";
import { LeaveStatus } from "@prisma/client";
import {
  CreateLeaveRequestDTO,
  UpdateLeaveRequestDTO,
  QueryLeavesDTO,
  DetailedLeaveRequest,
  LeaveBalance,
  LeaveType,
  CheckLeaveBalanceDTO,
  LeaveBalanceCheckResult,
} from "@/types/leave.types";

// Helper function to calculate business days between two dates
function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday (0) or Saturday (6)
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}

// Helper function to check if date range contains only weekend days
function containsOnlyWeekends(startDate: Date, endDate: Date): boolean {
  const currentDate = new Date(startDate);
  let hasWeekday = false;

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Found a weekday (Monday-Friday)
      hasWeekday = true;
      break;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return !hasWeekday;
}

// Helper function to validate leave dates
function validateLeaveDates(startDate: Date, endDate: Date): void {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (startDate < now) {
    throw new AppError("Start date cannot be in the past", 400);
  }

  if (endDate < startDate) {
    throw new AppError("End date cannot be before start date", 400);
  }
}

// Prisma include for detailed leave request
const leaveRequestInclude = {
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
  leaveType: true,
  approvedBy: {
    include: {
      user: true,
    },
  },
  rejectedBy: {
    include: {
      user: true,
    },
  },
  leaveComments: {
    include: {
      employee: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  },
} as const;

/**
 * Create a new leave request
 */
export async function createLeaveRequest(
  employeeId: string,
  organizationId: string,
  data: CreateLeaveRequestDTO
): Promise<DetailedLeaveRequest> {
  try {
    const { leaveTypeId, startDate, endDate, reason } = data;

    // Validate dates
    validateLeaveDates(startDate, endDate);

    // Verify leave type exists and belongs to the organization
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        organizationId,
      },
    });

    if (!leaveType) {
      throw new AppError("Invalid leave type", 400);
    }

    // Calculate total days
    const totalDays = calculateBusinessDays(startDate, endDate);

    if (totalDays === 0) {
      throw new AppError(
        "Leave request must include at least one business day",
        400
      );
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId,
        leaveTypeId,
        year: currentYear,
      },
    });

    if (leaveBalance && leaveBalance.availableDays < totalDays) {
      throw new AppError(
        `Insufficient leave balance. Available: ${leaveBalance.availableDays} days, Requested: ${totalDays} days`,
        400
      );
    }

    // Check for overlapping leave requests
    const overlappingLeaves = await prisma.leaveRequest.findMany({
      where: {
        employees: {
          some: {
            employeeId,
          },
        },
        status: {
          in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
        },
        OR: [
          {
            startDate: {
              lte: endDate,
            },
            endDate: {
              gte: startDate,
            },
          },
        ],
      },
    });

    if (overlappingLeaves.length > 0) {
      throw new AppError(
        "You have overlapping leave requests for the selected dates",
        400
      );
    }

    // Create the leave request with pivot table entry
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        leaveTypeId,
        startDate,
        endDate,
        totalDays,
        reason,
        status: LeaveStatus.PENDING,
        employees: {
          create: {
            employeeId,
          },
        },
      },
      include: leaveRequestInclude,
    });

    logger.info(
      `Leave request created: ${leaveRequest.id} by employee: ${employeeId}`
    );

    return leaveRequest as DetailedLeaveRequest;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Create leave request error: ${error}`);
    throw new AppError("Failed to create leave request", 500);
  }
}

/**
 * Get all leave requests for an employee
 */
export async function getEmployeeLeaveRequests(
  employeeId: string,
  query: QueryLeavesDTO
): Promise<{
  leaveRequests: DetailedLeaveRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  try {
    const {
      status,
      leaveTypeId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    // Build where clause
    const where: Record<string, unknown> = {
      employees: {
        some: {
          employeeId,
        },
      },
    };

    if (status) {
      where.status = status;
    }

    if (leaveTypeId) {
      where.leaveTypeId = leaveTypeId;
    }

    if (startDate || endDate) {
      const andConditions: Record<string, unknown>[] = [];

      if (startDate) {
        andConditions.push({
          startDate: {
            gte: startDate,
          },
        });
      }

      if (endDate) {
        andConditions.push({
          endDate: {
            lte: endDate,
          },
        });
      }

      where.AND = andConditions;
    }

    // Get total count
    const total = await prisma.leaveRequest.count({ where });

    // Get paginated results
    const skip = (page - 1) * limit;
    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: leaveRequestInclude,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    logger.info(
      `Retrieved ${leaveRequests.length} leave requests for employee: ${employeeId}`
    );

    return {
      leaveRequests: leaveRequests as DetailedLeaveRequest[],
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  } catch (error) {
    logger.error(`Get employee leave requests error: ${error}`);
    throw new AppError("Failed to retrieve leave requests", 500);
  }
}

/**
 * Get a single leave request by ID
 */
export async function getLeaveRequestById(
  leaveRequestId: string,
  employeeId: string
): Promise<DetailedLeaveRequest> {
  try {
    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        employees: {
          some: {
            employeeId, // Ensure user can only access their own leave requests
          },
        },
      },
      include: leaveRequestInclude,
    });

    if (!leaveRequest) {
      throw new AppError("Leave request not found", 404);
    }

    logger.info(
      `Retrieved leave request: ${leaveRequestId} for employee: ${employeeId}`
    );

    return leaveRequest as DetailedLeaveRequest;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Get leave request by ID error: ${error}`);
    throw new AppError("Failed to retrieve leave request", 500);
  }
}

/**
 * Update a leave request (only if pending)
 */
export async function updateLeaveRequest(
  leaveRequestId: string,
  employeeId: string,
  organizationId: string,
  data: UpdateLeaveRequestDTO
): Promise<DetailedLeaveRequest> {
  try {
    const { leaveTypeId, startDate, endDate, reason } = data;

    // First, get the existing leave request
    const existingLeaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        employees: {
          some: {
            employeeId,
          },
        },
      },
    });

    if (!existingLeaveRequest) {
      throw new AppError("Leave request not found", 404);
    }

    if (existingLeaveRequest.status !== LeaveStatus.PENDING) {
      throw new AppError("Can only edit pending leave requests", 400);
    }

    // Prepare update data
    const updateData = {} as Record<string, unknown>;

    if (reason !== undefined) {
      updateData.reason = reason;
    }

    // Handle date and leave type updates
    const finalStartDate = startDate || existingLeaveRequest.startDate;
    const finalEndDate = endDate || existingLeaveRequest.endDate;
    const finalLeaveTypeId = leaveTypeId || existingLeaveRequest.leaveTypeId;

    // Validate dates if they're being changed
    if (startDate || endDate) {
      validateLeaveDates(finalStartDate, finalEndDate);
    }

    // Verify leave type if it's being changed
    if (leaveTypeId) {
      const leaveType = await prisma.leaveType.findFirst({
        where: {
          id: leaveTypeId,
          organizationId,
        },
      });

      if (!leaveType) {
        throw new AppError("Invalid leave type", 400);
      }

      updateData.leaveTypeId = leaveTypeId;
    }

    // Calculate new total days if dates are changing
    if (startDate || endDate) {
      const totalDays = calculateBusinessDays(finalStartDate, finalEndDate);

      if (totalDays === 0) {
        throw new AppError(
          "Leave request must include at least one business day",
          400
        );
      }

      updateData.startDate = finalStartDate;
      updateData.endDate = finalEndDate;
      updateData.totalDays = totalDays;

      // Check for overlapping leave requests (excluding current one)
      const overlappingLeaves = await prisma.leaveRequest.findMany({
        where: {
          employees: {
            some: {
              employeeId,
            },
          },
          id: {
            not: leaveRequestId,
          },
          status: {
            in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
          },
          OR: [
            {
              startDate: {
                lte: finalEndDate,
              },
              endDate: {
                gte: finalStartDate,
              },
            },
          ],
        },
      });

      if (overlappingLeaves.length > 0) {
        throw new AppError(
          "You have overlapping leave requests for the selected dates",
          400
        );
      }

      // Check leave balance if total days changed
      const currentYear = new Date().getFullYear();
      const leaveBalance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId,
          leaveTypeId: finalLeaveTypeId,
          year: currentYear,
        },
      });

      if (leaveBalance) {
        // Calculate available days considering the current request is being updated
        const availableDays =
          leaveBalance.availableDays + existingLeaveRequest.totalDays;

        if (availableDays < totalDays) {
          throw new AppError(
            `Insufficient leave balance. Available: ${availableDays} days, Requested: ${totalDays} days`,
            400
          );
        }
      }
    }

    // Update the leave request
    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: {
        id: leaveRequestId,
      },
      data: updateData,
      include: leaveRequestInclude,
    });

    logger.info(
      `Leave request updated: ${leaveRequestId} by employee: ${employeeId}`
    );

    return updatedLeaveRequest as DetailedLeaveRequest;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Update leave request error: ${error}`);
    throw new AppError("Failed to update leave request", 500);
  }
}

/**
 * Cancel a leave request
 */
export async function cancelLeaveRequest(
  leaveRequestId: string,
  employeeId: string,
  reason?: string
): Promise<DetailedLeaveRequest> {
  try {
    // First, get the existing leave request
    const existingLeaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        employees: {
          some: {
            employeeId,
          },
        },
      },
    });

    if (!existingLeaveRequest) {
      throw new AppError("Leave request not found", 404);
    }

    if (existingLeaveRequest.status === LeaveStatus.CANCELLED) {
      throw new AppError("Leave request is already cancelled", 400);
    }

    if (existingLeaveRequest.status === LeaveStatus.REJECTED) {
      throw new AppError("Cannot cancel a rejected leave request", 400);
    }

    // Update the leave request status to cancelled
    const cancelledLeaveRequest = await prisma.leaveRequest.update({
      where: {
        id: leaveRequestId,
      },
      data: {
        status: LeaveStatus.CANCELLED,
      },
      include: leaveRequestInclude,
    });

    // Add a comment if reason is provided
    if (reason) {
      await prisma.leaveComment.create({
        data: {
          content: `Leave cancelled by employee. Reason: ${reason}`,
          employeeId,
          leaveRequestId,
          isInternal: false,
        },
      });
    }

    logger.info(
      `Leave request cancelled: ${leaveRequestId} by employee: ${employeeId}`
    );

    return cancelledLeaveRequest as DetailedLeaveRequest;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Cancel leave request error: ${error}`);
    throw new AppError("Failed to cancel leave request", 500);
  }
}

/**
 * Get employee leave balances
 */
export async function getEmployeeLeaveBalances(
  employeeId: string,
  year?: number
): Promise<LeaveBalance[]> {
  try {
    const currentYear = year || new Date().getFullYear();

    const leaveBalances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year: currentYear,
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
            description: true,
            maxDaysPerYear: true,
          },
        },
      },
    });

    logger.info(
      `Retrieved leave balances for employee: ${employeeId}, year: ${currentYear}`
    );

    return leaveBalances as LeaveBalance[];
  } catch (error) {
    logger.error(`Get employee leave balances error: ${error}`);
    throw new AppError("Failed to retrieve leave balances", 500);
  }
}

/**
 * Get organization leave types
 */
export async function getOrganizationLeaveTypes(
  organizationId: string
): Promise<LeaveType[]> {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        maxDaysPerYear: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    logger.info(
      `Retrieved ${leaveTypes.length} leave types for organization: ${organizationId}`
    );

    return leaveTypes;
  } catch (error) {
    logger.error(`Get organization leave types error: ${error}`);
    throw new AppError("Failed to retrieve leave types", 500);
  }
}

/**
 * Check leave balance for a specific date range and leave type
 */
export async function checkLeaveBalance(
  employeeId: string,
  organizationId: string,
  data: CheckLeaveBalanceDTO
): Promise<LeaveBalanceCheckResult> {
  try {
    const { leaveTypeId, startDate, endDate } = data;

    // Validate dates
    validateLeaveDates(startDate, endDate);

    // Verify leave type exists and belongs to the organization
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        maxDaysPerYear: true,
      },
    });

    if (!leaveType) {
      throw new AppError("Invalid leave type", 400);
    }

    // Check if the selected dates contain only weekends
    if (containsOnlyWeekends(startDate, endDate)) {
      return {
        leaveType,
        currentBalance: null,
        requestedDays: 0,
        isAllowed: false,
        conflicts: [
          {
            type: "weekend_only",
            message:
              "The selected dates are weekends (Saturday/Sunday) which are already holidays",
            details: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          },
        ],
        overlappingLeaves: [],
      };
    }

    // Calculate requested days
    const requestedDays = calculateBusinessDays(startDate, endDate);

    if (requestedDays === 0) {
      return {
        leaveType,
        currentBalance: null,
        requestedDays,
        isAllowed: false,
        conflicts: [
          {
            type: "invalid_dates",
            message: "Leave request must include at least one business day",
          },
        ],
        overlappingLeaves: [],
      };
    }

    // Get current year's leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId,
        leaveTypeId,
        year: currentYear,
      },
    });

    // Check for overlapping leave requests
    const overlappingLeaves = await prisma.leaveRequest.findMany({
      where: {
        employees: {
          some: {
            employeeId,
          },
        },
        status: {
          in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
        },
        OR: [
          {
            startDate: {
              lte: endDate,
            },
            endDate: {
              gte: startDate,
            },
          },
        ],
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        status: true,
        leaveType: {
          select: {
            name: true,
          },
        },
      },
    });

    // Initialize conflicts array
    const conflicts: LeaveBalanceCheckResult["conflicts"] = [];

    // Check if leave balance record exists
    if (!leaveBalance) {
      conflicts.push({
        type: "no_balance_record",
        message: `No leave balance record found for ${leaveType.name} in ${currentYear}`,
        details: {
          leaveTypeId,
          year: currentYear,
        },
      });
    }

    // Check for sufficient balance
    if (leaveBalance && leaveBalance.availableDays < requestedDays) {
      conflicts.push({
        type: "insufficient_balance",
        message: `Insufficient leave balance. Available: ${leaveBalance.availableDays} days, Requested: ${requestedDays} days`,
        details: {
          available: leaveBalance.availableDays,
          requested: requestedDays,
          shortage: requestedDays - leaveBalance.availableDays,
        },
      });
    }

    // Check for overlapping leaves
    if (overlappingLeaves.length > 0) {
      const overlappingDetails = overlappingLeaves.map(leave => ({
        id: leave.id,
        dates: `${leave.startDate.toLocaleDateString()} - ${leave.endDate.toLocaleDateString()}`,
        leaveType: leave.leaveType.name,
        status: leave.status,
        totalDays: leave.totalDays,
      }));

      conflicts.push({
        type: "overlapping_leave",
        message: `The selected dates overlap with ${overlappingLeaves.length} existing leave request(s). Please choose different dates or cancel the conflicting requests.`,
        details: {
          count: overlappingLeaves.length,
          overlappingRequests: overlappingDetails,
        },
      });
    }

    // Determine if the request is allowed
    const isAllowed = conflicts.length === 0;

    logger.info(
      `Leave balance check completed for employee: ${employeeId}, leave type: ${leaveTypeId}, requested days: ${requestedDays}, allowed: ${isAllowed}`
    );

    return {
      leaveType,
      currentBalance: leaveBalance
        ? {
            totalDays: leaveBalance.totalDays,
            usedDays: leaveBalance.usedDays,
            availableDays: leaveBalance.availableDays,
            carriedOver: leaveBalance.carriedOver,
            year: leaveBalance.year,
          }
        : null,
      requestedDays,
      isAllowed,
      conflicts,
      overlappingLeaves: overlappingLeaves.map(leave => ({
        id: leave.id,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        status: leave.status,
        leaveType: {
          name: leave.leaveType.name,
        },
      })),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Check leave balance error: ${error}`);
    throw new AppError("Failed to check leave balance", 500);
  }
}

/**
 * Get pending leave requests for review (for managers/HR)
 */
export async function getPendingLeaveRequestsForReview(
  organizationId: string,
  query: QueryLeavesDTO
): Promise<{
  leaveRequests: DetailedLeaveRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  try {
    const { leaveTypeId, startDate, endDate, page = 1, limit = 10 } = query;

    // Build where clause for pending requests in the organization
    const where: Record<string, unknown> = {
      status: LeaveStatus.PENDING,
      employees: {
        some: {
          employee: {
            organizationId,
          },
        },
      },
    };

    if (leaveTypeId) {
      where.leaveTypeId = leaveTypeId;
    }

    if (startDate || endDate) {
      const andConditions: Record<string, unknown>[] = [];

      if (startDate) {
        andConditions.push({
          startDate: {
            gte: startDate,
          },
        });
      }

      if (endDate) {
        andConditions.push({
          endDate: {
            lte: endDate,
          },
        });
      }

      where.AND = andConditions;
    }

    // Get total count
    const total = await prisma.leaveRequest.count({ where });

    // Get paginated results
    const skip = (page - 1) * limit;
    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: leaveRequestInclude,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    logger.info(
      `Retrieved ${leaveRequests.length} pending leave requests for organization: ${organizationId}`
    );

    return {
      leaveRequests: leaveRequests as DetailedLeaveRequest[],
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  } catch (error) {
    logger.error(`Get pending leave requests error: ${error}`);
    throw new AppError("Failed to retrieve pending leave requests", 500);
  }
}

/**
 * Approve a leave request
 */
export async function approveLeaveRequest(
  leaveRequestId: string,
  approverId: string,
  comment?: string
): Promise<DetailedLeaveRequest> {
  try {
    // Get the leave request
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: {
        id: leaveRequestId,
      },
      include: {
        employees: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new AppError("Leave request not found", 404);
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new AppError(
        `Cannot approve a ${leaveRequest.status.toLowerCase()} leave request`,
        400
      );
    }

    // Get the employee who made the request
    const requestEmployee = leaveRequest.employees[0]?.employee;
    if (!requestEmployee) {
      throw new AppError("Leave request employee not found", 404);
    }

    // Update the leave request
    const approvedLeaveRequest = await prisma.leaveRequest.update({
      where: {
        id: leaveRequestId,
      },
      data: {
        status: LeaveStatus.APPROVED,
        approvedById: approverId,
        approvedAt: new Date(),
      },
      include: leaveRequestInclude,
    });

    // Update leave balance (deduct used days)
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: requestEmployee.id,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: currentYear,
      },
    });

    if (leaveBalance) {
      await prisma.leaveBalance.update({
        where: {
          id: leaveBalance.id,
        },
        data: {
          usedDays: {
            increment: leaveRequest.totalDays,
          },
          availableDays: {
            decrement: leaveRequest.totalDays,
          },
        },
      });
    }

    // Add a comment if provided
    if (comment) {
      await prisma.leaveComment.create({
        data: {
          content: comment,
          employeeId: approverId,
          leaveRequestId,
          isInternal: false,
        },
      });
    }

    logger.info(
      `Leave request approved: ${leaveRequestId} by employee: ${approverId}`
    );

    return approvedLeaveRequest as DetailedLeaveRequest;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Approve leave request error: ${error}`);
    throw new AppError("Failed to approve leave request", 500);
  }
}

/**
 * Reject a leave request
 */
export async function rejectLeaveRequest(
  leaveRequestId: string,
  rejecterId: string,
  comment: string
): Promise<DetailedLeaveRequest> {
  try {
    // Get the leave request
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: {
        id: leaveRequestId,
      },
    });

    if (!leaveRequest) {
      throw new AppError("Leave request not found", 404);
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new AppError(
        `Cannot reject a ${leaveRequest.status.toLowerCase()} leave request`,
        400
      );
    }

    // Update the leave request
    const rejectedLeaveRequest = await prisma.leaveRequest.update({
      where: {
        id: leaveRequestId,
      },
      data: {
        status: LeaveStatus.REJECTED,
        rejectedById: rejecterId,
        rejectedAt: new Date(),
      },
      include: leaveRequestInclude,
    });

    // Add a comment with rejection reason
    await prisma.leaveComment.create({
      data: {
        content: comment,
        employeeId: rejecterId,
        leaveRequestId,
        isInternal: false,
      },
    });

    logger.info(
      `Leave request rejected: ${leaveRequestId} by employee: ${rejecterId}`
    );

    return rejectedLeaveRequest as DetailedLeaveRequest;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Reject leave request error: ${error}`);
    throw new AppError("Failed to reject leave request", 500);
  }
}
