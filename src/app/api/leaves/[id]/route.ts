import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import {
  getLeaveRequestById,
  updateLeaveRequest,
  cancelLeaveRequest,
} from "@/services/leave-server.service";
import {
  updateLeaveRequestSchema,
  leaveIdParamSchema,
  cancelLeaveSchema,
} from "@/schemas/leave.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/leaves/[id] - Get a single leave request by ID
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
    const { id } = leaveIdParamSchema.parse(resolvedParams);

    logger.info(
      `Fetching leave request: ${id} for employee: ${session.employee.id}`
    );

    // Get leave request
    const leaveRequest = await getLeaveRequestById(id, session.employee.id);

    logger.info(`Leave request retrieved successfully: ${id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Leave request retrieved successfully",
        data: leaveRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Get leave request API error: ${appError.message}`, {
      error: appError,
      statusCode: appError.statusCode,
      leaveRequestId: (await params).id,
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
 * PATCH /api/leaves/[id] - Update a leave request
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
    const { id } = leaveIdParamSchema.parse(resolvedParams);

    const body = await request.json();

    // Validate request body
    const validatedData = updateLeaveRequestSchema.parse(body);

    logger.info(
      `Updating leave request: ${id} for employee: ${session.employee.id}`
    );

    // Update leave request
    const updatedLeaveRequest = await updateLeaveRequest(
      id,
      session.employee.id,
      session.employee.organizationId,
      validatedData
    );

    logger.info(`Leave request updated successfully: ${id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Leave request updated successfully",
        data: updatedLeaveRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Update leave request API error: ${appError.message}`, {
      error: appError,
      statusCode: appError.statusCode,
      leaveRequestId: (await params).id,
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
 * DELETE /api/leaves/[id] - Cancel a leave request
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
    const { id } = leaveIdParamSchema.parse(resolvedParams);

    // Parse request body (optional cancellation reason)
    let cancelData = {};
    try {
      const body = await request.json();
      cancelData = cancelLeaveSchema.parse(body);
    } catch {
      // Body is optional for cancellation
    }

    logger.info(
      `Cancelling leave request: ${id} for employee: ${session.employee.id}`
    );

    // Cancel leave request
    const cancelledLeaveRequest = await cancelLeaveRequest(
      id,
      session.employee.id,
      (cancelData as { reason?: string }).reason
    );

    logger.info(`Leave request cancelled successfully: ${id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Leave request cancelled successfully",
        data: cancelledLeaveRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Cancel leave request API error: ${appError.message}`, {
      error: appError,
      statusCode: appError.statusCode,
      leaveRequestId: (await params).id,
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
