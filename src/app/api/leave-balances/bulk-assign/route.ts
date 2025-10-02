import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { bulkAssignLeaveType } from "@/services/leave-balance-server.service";
import { bulkAssignLeaveTypeSchema } from "@/schemas/leave-balance.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * POST /api/leave-balances/bulk-assign - Bulk assign leave type to multiple employees
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

    const body = await request.json();

    // Validate request body
    const validatedData = bulkAssignLeaveTypeSchema.parse(body);

    logger.info(
      `Bulk assigning leave type ${validatedData.leaveTypeId} to ${validatedData.employeeIds?.length || 0} employees in organization: ${session.employee.organizationId}`
    );

    // Bulk assign leave type
    const result = await bulkAssignLeaveType(
      session.employee.organizationId,
      session.employee.role,
      validatedData
    );

    logger.info(
      `Bulk assignment completed: ${result.summary.successful} successful, ${result.summary.failed} failed`
    );

    // Determine response status based on results
    let status = 200;
    let message = "Bulk assignment completed";

    if (result.summary.successful === result.summary.total) {
      status = 201;
      message = "All employees assigned successfully";
    } else if (result.summary.successful === 0) {
      status = 400;
      message = "No employees were assigned";
    } else {
      message = `Partially successful: ${result.summary.successful} out of ${result.summary.total} employees assigned`;
    }

    return NextResponse.json(
      {
        success: result.summary.successful > 0,
        message,
        data: result,
      },
      { status }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Bulk assign leave type API error: ${appError.message}`, {
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
