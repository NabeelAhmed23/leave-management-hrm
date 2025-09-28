import { prisma } from "@/lib/prisma";
import { logger } from "@/services/logger.service";
import { AppError } from "@/utils/app-error";
import { Role } from "@prisma/client";
import {
  CreateLeaveTypeDTO,
  UpdateLeaveTypeDTO,
  QueryLeaveTypesDTO,
  DetailedLeaveType,
} from "@/types/leave-type.types";

// Prisma include for detailed leave type
const leaveTypeInclude = {
  organization: {
    select: {
      id: true,
      name: true,
      domain: true,
    },
  },
  _count: {
    select: {
      leaveRequests: true,
      leaveBalances: true,
      leavePolicies: true,
    },
  },
} as const;

/**
 * Verify user has permission to manage leave types
 */
function verifyLeaveTypePermission(userRole: Role): void {
  if (userRole !== Role.HR_ADMIN && userRole !== Role.SUPER_ADMIN) {
    throw new AppError("Insufficient permissions to manage leave types", 403);
  }
}

/**
 * Create a new leave type
 */
export async function createLeaveType(
  organizationId: string,
  userRole: Role,
  data: CreateLeaveTypeDTO
): Promise<DetailedLeaveType> {
  try {
    // Verify permissions
    verifyLeaveTypePermission(userRole);

    const { name, description, maxDaysPerYear } = data;

    // Check if leave type with same name already exists in organization
    const existingLeaveType = await prisma.leaveType.findFirst({
      where: {
        name: name.trim(),
        organizationId,
      },
    });

    if (existingLeaveType) {
      throw new AppError(
        "A leave type with this name already exists in your organization",
        400
      );
    }

    // Create the leave type
    const leaveType = await prisma.leaveType.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        maxDaysPerYear,
        organizationId,
      },
      include: leaveTypeInclude,
    });

    logger.info(
      `Leave type created: ${leaveType.id} (${leaveType.name}) for organization: ${organizationId}`
    );

    return leaveType as DetailedLeaveType;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Create leave type error: ${error}`);
    throw new AppError("Failed to create leave type", 500);
  }
}

/**
 * Get all leave types for an organization
 */
export async function getOrganizationLeaveTypes(
  organizationId: string,
  query: QueryLeaveTypesDTO
): Promise<{
  leaveTypes: DetailedLeaveType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  try {
    const { search, page = 1, limit = 10 } = query;

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId,
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.leaveType.count({ where });

    // Get paginated results
    const skip = (page - 1) * limit;
    const leaveTypes = await prisma.leaveType.findMany({
      where,
      include: leaveTypeInclude,
      orderBy: {
        name: "asc",
      },
      skip,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    logger.info(
      `Retrieved ${leaveTypes.length} leave types for organization: ${organizationId}`
    );

    return {
      leaveTypes: leaveTypes as DetailedLeaveType[],
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  } catch (error) {
    logger.error(`Get organization leave types error: ${error}`);
    throw new AppError("Failed to retrieve leave types", 500);
  }
}

/**
 * Get a single leave type by ID
 */
export async function getLeaveTypeById(
  leaveTypeId: string,
  organizationId: string
): Promise<DetailedLeaveType> {
  try {
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        organizationId,
      },
      include: leaveTypeInclude,
    });

    if (!leaveType) {
      throw new AppError("Leave type not found", 404);
    }

    logger.info(
      `Retrieved leave type: ${leaveTypeId} for organization: ${organizationId}`
    );

    return leaveType as DetailedLeaveType;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Get leave type by ID error: ${error}`);
    throw new AppError("Failed to retrieve leave type", 500);
  }
}

/**
 * Update a leave type
 */
export async function updateLeaveType(
  leaveTypeId: string,
  organizationId: string,
  userRole: Role,
  data: UpdateLeaveTypeDTO
): Promise<DetailedLeaveType> {
  try {
    // Verify permissions
    verifyLeaveTypePermission(userRole);

    const { name, description, maxDaysPerYear } = data;

    // Check if leave type exists
    const existingLeaveType = await prisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        organizationId,
      },
    });

    if (!existingLeaveType) {
      throw new AppError("Leave type not found", 404);
    }

    // Check if name is being changed and conflicts with existing leave type
    if (name && name.trim() !== existingLeaveType.name) {
      const conflictingLeaveType = await prisma.leaveType.findFirst({
        where: {
          name: name.trim(),
          organizationId,
          id: {
            not: leaveTypeId,
          },
        },
      });

      if (conflictingLeaveType) {
        throw new AppError(
          "A leave type with this name already exists in your organization",
          400
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (maxDaysPerYear !== undefined) {
      updateData.maxDaysPerYear = maxDaysPerYear;
    }

    // Update the leave type
    const updatedLeaveType = await prisma.leaveType.update({
      where: {
        id: leaveTypeId,
      },
      data: updateData,
      include: leaveTypeInclude,
    });

    logger.info(
      `Leave type updated: ${leaveTypeId} for organization: ${organizationId}`
    );

    return updatedLeaveType as DetailedLeaveType;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Update leave type error: ${error}`);
    throw new AppError("Failed to update leave type", 500);
  }
}

/**
 * Delete a leave type
 */
export async function deleteLeaveType(
  leaveTypeId: string,
  organizationId: string,
  userRole: Role
): Promise<{ message: string }> {
  try {
    // Verify permissions
    verifyLeaveTypePermission(userRole);

    // Check if leave type exists
    const existingLeaveType = await prisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        organizationId,
      },
      include: {
        _count: {
          select: {
            leaveRequests: true,
            leaveBalances: true,
            leavePolicies: true,
          },
        },
      },
    });

    if (!existingLeaveType) {
      throw new AppError("Leave type not found", 404);
    }

    // Check if leave type is in use
    const totalUsage =
      existingLeaveType._count.leaveRequests +
      existingLeaveType._count.leaveBalances +
      existingLeaveType._count.leavePolicies;

    if (totalUsage > 0) {
      throw new AppError(
        "Cannot delete leave type that is currently in use. Please ensure all related leave requests, balances, and policies are removed first.",
        400,
        {
          usage: {
            leaveRequests: existingLeaveType._count.leaveRequests,
            leaveBalances: existingLeaveType._count.leaveBalances,
            leavePolicies: existingLeaveType._count.leavePolicies,
          },
        }
      );
    }

    // Delete the leave type
    await prisma.leaveType.delete({
      where: {
        id: leaveTypeId,
      },
    });

    logger.info(
      `Leave type deleted: ${leaveTypeId} (${existingLeaveType.name}) for organization: ${organizationId}`
    );

    return {
      message: `Leave type "${existingLeaveType.name}" has been successfully deleted`,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`Delete leave type error: ${error}`);
    throw new AppError("Failed to delete leave type", 500);
  }
}

/**
 * Get simple leave types list (for dropdowns/selects)
 */
export async function getSimpleLeaveTypes(
  organizationId: string
): Promise<Array<{ id: string; name: string; maxDaysPerYear: number }>> {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        name: true,
        maxDaysPerYear: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    logger.info(
      `Retrieved ${leaveTypes.length} simple leave types for organization: ${organizationId}`
    );

    return leaveTypes;
  } catch (error) {
    logger.error(`Get simple leave types error: ${error}`);
    throw new AppError("Failed to retrieve leave types", 500);
  }
}
