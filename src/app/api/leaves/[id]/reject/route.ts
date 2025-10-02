import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { rejectLeaveRequest } from "@/services/leave-server.service";
import { rejectLeaveSchema, leaveIdParamSchema } from "@/schemas/leave.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";
import { Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/leaves/[id]/reject - Reject a leave request
 * Only accessible to MANAGER and HR_ADMIN roles
 */
export async function POST(
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

    // Check authorization - only MANAGER and HR_ADMIN can reject
    const userRole = session.employee.role;
    if (userRole !== Role.MANAGER && userRole !== Role.HR_ADMIN) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only managers and HR administrators can reject leave requests",
        },
        { status: 403 }
      );
    }

    // Validate route parameters
    const resolvedParams = await params;
    const { id } = leaveIdParamSchema.parse(resolvedParams);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = rejectLeaveSchema.parse(body);

    logger.info(
      `Rejecting leave request: ${id} by employee: ${session.employee.id}`
    );

    // Reject leave request
    const rejectedLeaveRequest = await rejectLeaveRequest(
      id,
      session.employee.id,
      validatedData.comment
    );

    logger.info(`Leave request rejected successfully: ${id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Leave request rejected successfully",
        data: rejectedLeaveRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Reject leave request API error: ${appError.message}`, {
      error: appError,
      statusCode: appError.statusCode,
      leaveRequestId: (await params).id,
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
