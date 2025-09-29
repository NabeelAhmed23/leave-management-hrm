import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import {
  getLeaveBalanceById,
  updateLeaveBalance,
  deleteLeaveBalance,
} from "@/services/leave-balance-server.service";
import {
  updateLeaveBalanceSchema,
  leaveBalanceIdParamSchema,
} from "@/schemas/leave-balance.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leave-balances/[id] - Get leave balance by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
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

    // Validate leave balance ID parameter
    const params = await context.params;
    const { id: leaveBalanceId } = leaveBalanceIdParamSchema.parse(params);

    logger.info(
      `Fetching leave balance: ${leaveBalanceId} for organization: ${session.employee.organizationId}`
    );

    // Get leave balance
    const leaveBalance = await getLeaveBalanceById(
      leaveBalanceId,
      session.employee.organizationId
    );

    // Check access permissions
    const userRole = session.employee.role;
    const isOwnBalance = session.employee.id === leaveBalance.employee.id;
    const canAccessAllBalances = ["HR_ADMIN", "SUPER_ADMIN"].includes(userRole);

    if (!isOwnBalance && !canAccessAllBalances) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Insufficient permissions",
        },
        { status: 403 }
      );
    }

    logger.info(`Leave balance retrieved successfully: ${leaveBalanceId}`);

    return NextResponse.json(
      {
        success: true,
        message: "Leave balance retrieved successfully",
        data: leaveBalance,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Get leave balance API error: ${appError.message}`, {
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

/**
 * PATCH /api/leave-balances/[id] - Update leave balance
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
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

    // Validate leave balance ID parameter
    const params = await context.params;
    const { id: leaveBalanceId } = leaveBalanceIdParamSchema.parse(params);

    const body = await request.json();

    // Validate request body
    const validatedData = updateLeaveBalanceSchema.parse(body);

    logger.info(
      `Updating leave balance: ${leaveBalanceId} for organization: ${session.employee.organizationId}`
    );

    // Update leave balance
    const updatedBalance = await updateLeaveBalance(
      leaveBalanceId,
      session.employee.organizationId,
      session.employee.role,
      validatedData
    );

    logger.info(`Leave balance updated successfully: ${leaveBalanceId}`);

    return NextResponse.json(
      {
        success: true,
        message: "Leave balance updated successfully",
        data: updatedBalance,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Update leave balance API error: ${appError.message}`, {
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

/**
 * DELETE /api/leave-balances/[id] - Delete leave balance
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
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

    // Validate leave balance ID parameter
    const params = await context.params;
    const { id: leaveBalanceId } = leaveBalanceIdParamSchema.parse(params);

    logger.info(
      `Deleting leave balance: ${leaveBalanceId} for organization: ${session.employee.organizationId}`
    );

    // Delete leave balance
    const result = await deleteLeaveBalance(
      leaveBalanceId,
      session.employee.organizationId,
      session.employee.role
    );

    logger.info(`Leave balance deleted successfully: ${leaveBalanceId}`);

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Delete leave balance API error: ${appError.message}`, {
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
