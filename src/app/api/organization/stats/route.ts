import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { getOrganizationStats } from "@/services/organization-server.service";
import { getOrganizationStatsSchema } from "@/schemas/organization.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * GET /api/organization/stats - Get organization statistics
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
    const validatedQuery = getOrganizationStatsSchema.parse(queryParams);

    logger.info(
      `Fetching organization statistics for: ${session.employee.organizationId}`
    );

    // Get organization statistics
    const stats = await getOrganizationStats(
      session.employee.organizationId,
      validatedQuery
    );

    logger.info(
      `Organization statistics retrieved successfully: ${session.employee.organizationId}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Organization statistics retrieved successfully",
        data: stats,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Get organization stats API error: ${appError.message}`, {
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
