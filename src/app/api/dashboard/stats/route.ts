import { NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";
import {
  getEmployeeDashboardStats,
  getManagerDashboardStats,
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

    logger.info("Fetching dashboard stats", {
      employeeId,
      organizationId,
      role,
    });

    // Determine if user is manager or admin
    const isManagerOrAdmin = role === Role.MANAGER || role === Role.HR_ADMIN;

    let stats;
    if (isManagerOrAdmin) {
      stats = await getManagerDashboardStats(organizationId);
    } else {
      stats = await getEmployeeDashboardStats(employeeId, organizationId);
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error in dashboard stats API", {
      error: error as Error,
    });

    const appError = AppError.from(error);
    return NextResponse.json(
      { success: false, message: appError.message },
      { status: appError.statusCode }
    );
  }
}
