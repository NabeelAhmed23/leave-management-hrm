import { NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";
import {
  getEmployeePendingRequests,
  getAllPendingApprovalRequests,
} from "@/services/dashboard-server.service";
import { Role } from "@prisma/client";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getCurrentSession();

    if (!session?.employee) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { organizationId, role, id: employeeId } = session.employee;

    logger.info("Fetching pending requests", {
      employeeId,
      organizationId,
      role,
    });

    // Determine if user is manager or admin
    const isManagerOrAdmin = role === Role.MANAGER || role === Role.HR_ADMIN;

    let pendingRequests;
    if (isManagerOrAdmin) {
      // Get all pending requests in organization for managers/admins
      pendingRequests = await getAllPendingApprovalRequests(organizationId);
    } else {
      // Get only employee's own pending requests
      pendingRequests = await getEmployeePendingRequests(employeeId);
    }

    return NextResponse.json({
      success: true,
      data: pendingRequests,
    });
  } catch (error) {
    logger.error("Error in dashboard pending requests API", {
      error: error as Error,
    });

    const appError = AppError.from(error);
    return NextResponse.json(
      { success: false, message: appError.message },
      { status: appError.statusCode }
    );
  }
}
