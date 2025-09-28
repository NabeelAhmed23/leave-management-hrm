import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import {
  createLeaveType,
  getOrganizationLeaveTypes,
} from "@/services/leave-type-server.service";
import {
  createLeaveTypeSchema,
  queryLeaveTypesSchema,
} from "@/schemas/leave-type.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * POST /api/leave-types - Create a new leave type
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
    const validatedData = createLeaveTypeSchema.parse(body);

    logger.info(
      `Creating leave type for organization: ${session.employee.organizationId}`
    );

    // Create leave type
    const leaveType = await createLeaveType(
      session.employee.organizationId,
      session.employee.role,
      validatedData
    );

    logger.info(`Leave type created successfully: ${leaveType.id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Leave type created successfully",
        data: leaveType,
      },
      { status: 201 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Create leave type API error: ${appError.message}`, {
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
 * GET /api/leave-types - Get all leave types for the organization
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
    const validatedQuery = queryLeaveTypesSchema.parse(queryParams);

    logger.info(
      `Fetching leave types for organization: ${session.employee.organizationId}`
    );

    // Get leave types
    const result = await getOrganizationLeaveTypes(
      session.employee.organizationId,
      validatedQuery
    );

    logger.info(
      `Retrieved ${result.leaveTypes.length} leave types for organization: ${session.employee.organizationId}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Leave types retrieved successfully",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Get leave types API error: ${appError.message}`, {
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
