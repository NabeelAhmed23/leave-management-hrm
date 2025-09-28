import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import {
  getOrganization,
  updateOrganization,
} from "@/services/organization-server.service";
import { updateOrganizationSchema } from "@/schemas/organization.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * GET /api/organization - Get organization details
 */
export async function GET(): Promise<NextResponse> {
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

    logger.info(
      `Fetching organization details for: ${session.employee.organizationId}`
    );

    // Get organization details
    const organization = await getOrganization(session.employee.organizationId);

    logger.info(
      `Organization details retrieved successfully: ${session.employee.organizationId}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Organization details retrieved successfully",
        data: organization,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Get organization API error: ${appError.message}`, {
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
 * PATCH /api/organization - Update organization details
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
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
    const validatedData = updateOrganizationSchema.parse(body);

    logger.info(
      `Updating organization: ${session.employee.organizationId} by user: ${session.employee.id}`
    );

    // Update organization
    const organization = await updateOrganization(
      session.employee.organizationId,
      session.employee.role,
      validatedData
    );

    logger.info(
      `Organization updated successfully: ${session.employee.organizationId}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Organization updated successfully",
        data: organization,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Update organization API error: ${appError.message}`, {
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
