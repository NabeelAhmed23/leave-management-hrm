import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import {
  createLeaveRequest,
  getEmployeeLeaveRequests,
} from "@/services/leave-server.service";
import {
  createLeaveRequestSchema,
  queryLeavesSchema,
} from "@/schemas/leave.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * POST /api/leaves - Create a new leave request
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
    const validatedData = createLeaveRequestSchema.parse(body);

    logger.info(`Creating leave request for employee: ${session.employee.id}`);

    // Create leave request
    const leaveRequest = await createLeaveRequest(
      session.employee.id,
      session.employee.organizationId,
      validatedData
    );

    logger.info(`Leave request created successfully: ${leaveRequest.id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Leave request created successfully",
        data: leaveRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Create leave request API error: ${appError.message}`, {
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
 * GET /api/leaves - Get all leave requests for the authenticated user
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

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = queryLeavesSchema.parse(queryParams);

    logger.info(`Fetching leave requests for employee: ${session.employee.id}`);

    // Get leave requests
    const result = await getEmployeeLeaveRequests(
      session.employee.id,
      validatedQuery
    );

    logger.info(
      `Retrieved ${result.leaveRequests.length} leave requests for employee: ${session.employee.id}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Leave requests retrieved successfully",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Get leave requests API error: ${appError.message}`, {
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
