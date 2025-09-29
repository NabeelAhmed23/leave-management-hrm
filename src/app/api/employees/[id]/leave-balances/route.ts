import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import {
  assignLeaveTypeToEmployee,
  getEmployeeLeaveBalances,
} from "@/services/leave-balance-server.service";
import {
  assignLeaveTypeSchema,
  queryLeaveBalancesSchema,
  employeeIdParamSchema,
} from "@/schemas/leave-balance.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/employees/[id]/leave-balances - Assign leave type to employee
 */
export async function POST(
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

    // Validate employee ID parameter
    const params = await context.params;
    const { id: employeeId } = employeeIdParamSchema.parse(params);

    const body = await request.json();

    // Validate request body
    const validatedData = assignLeaveTypeSchema.parse(body);

    logger.info(
      `Assigning leave type ${validatedData.leaveTypeId} to employee: ${employeeId}, organization: ${session.employee.organizationId}`
    );

    // Assign leave type to employee
    const leaveBalance = await assignLeaveTypeToEmployee(
      employeeId,
      session.employee.organizationId,
      session.employee.role,
      validatedData
    );

    logger.info(
      `Leave type assigned successfully: ${leaveBalance.id} for employee: ${employeeId}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Leave type assigned successfully",
        data: leaveBalance,
      },
      { status: 201 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Assign leave type API error: ${appError.message}`, {
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
 * GET /api/employees/[id]/leave-balances - Get employee leave balances
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

    // Validate employee ID parameter
    const params = await context.params;
    const { id: employeeId } = employeeIdParamSchema.parse(params);

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = queryLeaveBalancesSchema.parse(queryParams);

    // Check if user can access this employee's data
    const userRole = session.employee.role;
    const isOwnData = session.employee.id === employeeId;
    const canAccessAllEmployees = ["HR_ADMIN", "SUPER_ADMIN"].includes(
      userRole
    );

    if (!isOwnData && !canAccessAllEmployees) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Insufficient permissions",
        },
        { status: 403 }
      );
    }

    logger.info(
      `Fetching leave balances for employee: ${employeeId}, organization: ${session.employee.organizationId}`
    );

    // Get employee leave balances
    const employeeWithBalances = await getEmployeeLeaveBalances(
      employeeId,
      session.employee.organizationId,
      validatedQuery
    );

    logger.info(
      `Retrieved ${employeeWithBalances.leaveBalances.length} leave balances for employee: ${employeeId}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Employee leave balances retrieved successfully",
        data: employeeWithBalances,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Get employee leave balances API error: ${appError.message}`, {
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
