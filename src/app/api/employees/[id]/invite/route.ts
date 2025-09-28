import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { sendEmployeeInvite } from "@/services/employee-server.service";
import {
  inviteEmployeeSchema,
  employeeIdParamSchema,
} from "@/schemas/employee.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * POST /api/employees/[id]/invite - Send or resend invite to specific employee
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Check authorization - only HR_ADMIN and SUPER_ADMIN can send invites
    const userRole = session.employee.role;
    if (!["HR_ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only HR administrators can send employee invites.",
        },
        { status: 403 }
      );
    }

    // Validate employee ID parameter
    const resolvedParams = await params;
    const validatedParams = employeeIdParamSchema.parse(resolvedParams);

    const body = await request.json();

    // Validate request body
    const validatedData = inviteEmployeeSchema.parse(body);

    logger.info(
      `Sending employee invite to: ${validatedData.email} for employee: ${validatedParams.id}`
    );

    // Send invite
    const result = await sendEmployeeInvite(validatedParams.id, validatedData);

    logger.info(`Employee invite sent successfully to: ${validatedData.email}`);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error(`Error in POST /api/employees/${(await params).id}/invite:`, {
      error: error as Error,
    });

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
