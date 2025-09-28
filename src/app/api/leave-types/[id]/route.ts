import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import {
  getLeaveTypeById,
  updateLeaveType,
  deleteLeaveType,
} from "@/services/leave-type-server.service";
import {
  updateLeaveTypeSchema,
  leaveTypeIdParamSchema,
} from "@/schemas/leave-type.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/leave-types/[id] - Get a single leave type
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getCurrentSession();
    if (!session || !session.employee) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Validate route parameters
    const resolvedParams = await params;
    const { id } = leaveTypeIdParamSchema.parse(resolvedParams);

    logger.info(
      `Fetching leave type: ${id} for organization: ${session.employee.organizationId}`
    );

    // Get leave type
    const leaveType = await getLeaveTypeById(
      id,
      session.employee.organizationId
    );

    logger.info(`Leave type retrieved successfully: ${id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Leave type retrieved successfully",
        data: leaveType,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Get leave type API error: ${appError.message}`, {
      error: appError,
      statusCode: appError.statusCode,
      leaveTypeId: (await params).id,
    });

    return NextResponse.json(
      {
        success: false,
        message: appError.message,
        details: appError.details,
      },
      { status: appError.statusCode }
    );
  }
}

/**
 * PATCH /api/leave-types/[id] - Update a leave type
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getCurrentSession();
    if (!session || !session.employee) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Validate route parameters
    const resolvedParams = await params;
    const { id } = leaveTypeIdParamSchema.parse(resolvedParams);

    const body = await request.json();

    // Validate request body
    const validatedData = updateLeaveTypeSchema.parse(body);

    logger.info(
      `Updating leave type: ${id} for organization: ${session.employee.organizationId}`
    );

    // Update leave type
    const leaveType = await updateLeaveType(
      id,
      session.employee.organizationId,
      session.employee.role,
      validatedData
    );

    logger.info(`Leave type updated successfully: ${id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Leave type updated successfully",
        data: leaveType,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Update leave type API error: ${appError.message}`, {
      error: appError,
      statusCode: appError.statusCode,
      leaveTypeId: (await params).id,
    });

    return NextResponse.json(
      {
        success: false,
        message: appError.message,
        details: appError.details,
      },
      { status: appError.statusCode }
    );
  }
}

/**
 * DELETE /api/leave-types/[id] - Delete a leave type
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getCurrentSession();
    if (!session || !session.employee) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Validate route parameters
    const resolvedParams = await params;
    const { id } = leaveTypeIdParamSchema.parse(resolvedParams);

    logger.info(
      `Deleting leave type: ${id} for organization: ${session.employee.organizationId}`
    );

    // Delete leave type
    const result = await deleteLeaveType(
      id,
      session.employee.organizationId,
      session.employee.role
    );

    logger.info(`Leave type deleted successfully: ${id}`);

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Delete leave type API error: ${appError.message}`, {
      error: appError,
      statusCode: appError.statusCode,
      leaveTypeId: (await params).id,
    });

    return NextResponse.json(
      {
        success: false,
        message: appError.message,
        details: appError.details,
      },
      { status: appError.statusCode }
    );
  }
}
