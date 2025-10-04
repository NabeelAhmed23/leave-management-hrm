import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { getReports } from "@/services/report-server.service";
import { queryReportsSchema } from "@/schemas/report.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * GET /api/reports - Get comprehensive reports based on user role and filters
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
    const validatedQuery = queryReportsSchema.parse(queryParams);

    logger.info(
      `Fetching reports for employee: ${session.employee.id}, role: ${session.employee.role}`
    );

    // Get reports
    const reportData = await getReports(
      session.employee.id,
      session.employee.organizationId,
      session.employee.role,
      validatedQuery
    );

    logger.info(
      `Reports retrieved successfully for employee: ${session.employee.id}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Reports retrieved successfully",
        data: reportData,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Get reports API error: ${appError.message}`, {
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
