import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import {
  getSelfLeaveEvents,
  getTeamLeaveEvents,
} from "@/services/calendar-server.service";
import { calendarLeaveQuerySchema } from "@/schemas/calendar.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * GET /api/calendar/leaves - Get leave events for calendar view
 * Query params:
 * - type: "SELF" | "TEAM" (required)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
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
    const queryParams = {
      type: searchParams.get("type"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    };

    // Validate query parameters
    const validatedQuery = calendarLeaveQuerySchema.parse(queryParams);

    logger.info("Fetching calendar leave events", {
      employeeId: session.employee.id,
      organizationId: session.employee.organizationId,
      type: validatedQuery.type,
      startDate: validatedQuery.startDate,
      endDate: validatedQuery.endDate,
    });

    // Parse dates if provided
    const startDate = validatedQuery.startDate
      ? new Date(validatedQuery.startDate)
      : undefined;
    const endDate = validatedQuery.endDate
      ? new Date(validatedQuery.endDate)
      : undefined;

    let events;

    if (validatedQuery.type === "SELF") {
      // Get only the current user's leaves
      events = await getSelfLeaveEvents(
        session.employee.id,
        startDate,
        endDate
      );
    } else {
      // Get all leaves in the organization
      events = await getTeamLeaveEvents(
        session.employee.organizationId,
        startDate,
        endDate
      );
    }

    logger.info("Successfully fetched calendar leave events", {
      employeeId: session.employee.id,
      type: validatedQuery.type,
      eventCount: events.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Leave events retrieved successfully",
        data: events,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error("Error in calendar leaves API", {
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
