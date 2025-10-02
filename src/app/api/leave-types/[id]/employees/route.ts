import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { getEmployeesAssignedToLeaveType } from "@/services/leave-balance-server.service";
import { leaveTypeIdParamSchema } from "@/schemas/leave-type.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/leave-types/[id]/employees - Get employees assigned to a leave type
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

    // Get year from query params (optional)
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    logger.info(
      `Fetching employees assigned to leave type: ${id} for organization: ${session.employee.organizationId}`
    );

    // Get employees assigned to this leave type
    const employeeIds = await getEmployeesAssignedToLeaveType(
      id,
      session.employee.organizationId,
      year
    );

    logger.info(
      `Retrieved ${employeeIds.length} employees assigned to leave type: ${id}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Employees retrieved successfully",
        data: employeeIds,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(
      `Get employees assigned to leave type API error: ${appError.message}`,
      {
        error: appError,
        statusCode: appError.statusCode,
        leaveTypeId: (await params).id,
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
