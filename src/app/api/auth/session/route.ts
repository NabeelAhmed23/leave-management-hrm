import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/services/auth-server.service";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get current session from cookies
    const user = await getCurrentSession();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "No active session",
          user: null,
        },
        { status: 401 }
      );
    }

    logger.info(`Session validated for user: ${user.id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Session valid",
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Session validation API error: ${appError.message}`, {
      error: appError,
      statusCode: appError.statusCode,
    });

    return NextResponse.json(
      {
        success: false,
        message: appError.message,
        user: null,
        details: appError.details,
      },
      { status: appError.statusCode }
    );
  }
}
