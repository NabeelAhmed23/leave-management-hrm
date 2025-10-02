import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { updateLeaveTypeAssignments } from "@/services/leave-balance-server.service";
import { bulkAssignLeaveTypeSchema } from "@/schemas/leave-balance.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * POST /api/leave-balances/update-assignments - Update employee assignments for a leave type
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bulkAssignLeaveTypeSchema.parse(body);

    logger.info(
      `Updating leave type assignments for organization: ${session.employee.organizationId}`
    );

    // Update leave type assignments
    const result = await updateLeaveTypeAssignments(
      session.employee.organizationId,
      session.employee.role,
      validatedData
    );

    logger.info(
      `Successfully updated leave type assignments: ${result.summary.successful} successful, ${result.summary.failed} failed`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Leave type assignments updated successfully",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(
      `Update leave type assignments API error: ${appError.message}`,
      {
        error: appError,
        statusCode: appError.statusCode,
      }
    );

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
