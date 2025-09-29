import { NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";
import { getTodayEvents } from "@/services/dashboard-server.service";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getCurrentSession();

    if (!session?.employee) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { organizationId } = session.employee;

    logger.info("Fetching today's events", {
      organizationId,
    });

    const events = await getTodayEvents(organizationId);

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    logger.error("Error in dashboard events API", {
      error: error as Error,
    });

    const appError = AppError.from(error);
    return NextResponse.json(
      { success: false, message: appError.message },
      { status: appError.statusCode }
    );
  }
}
