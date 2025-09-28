import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { getSimpleLeaveTypes } from "@/services/leave-type-server.service";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * GET /api/leave-types/simple - Get simple leave types list (for dropdowns)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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

    logger.info(
      `Fetching simple leave types for organization: ${session.employee.organizationId}`
    );

    // Get simple leave types
    const leaveTypes = await getSimpleLeaveTypes(
      session.employee.organizationId
    );

    logger.info(
      `Retrieved ${leaveTypes.length} simple leave types for organization: ${session.employee.organizationId}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Leave types retrieved successfully",
        data: leaveTypes,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Get simple leave types API error: ${appError.message}`, {
      error: appError,
      statusCode: appError.statusCode,
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
