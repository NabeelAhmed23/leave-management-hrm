import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { checkLeaveBalance } from "@/services/leave-server.service";
import { checkLeaveBalanceSchema } from "@/schemas/leave.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * POST /api/leaves/check-balance - Check leave balance for a specific date range and leave type
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
    const validatedData = checkLeaveBalanceSchema.parse(body);

    logger.info(
      `Checking leave balance for employee: ${session.employee.id}, leave type: ${validatedData.leaveTypeId}`
    );

    // Check leave balance
    const balanceCheck = await checkLeaveBalance(
      session.employee.id,
      session.employee.organizationId,
      validatedData
    );

    logger.info(
      `Leave balance check completed for employee: ${session.employee.id}, allowed: ${balanceCheck.isAllowed}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Leave balance check completed successfully",
        data: balanceCheck,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Check leave balance API error: ${appError.message}`, {
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
