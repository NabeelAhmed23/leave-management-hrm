import { NextRequest, NextResponse } from "next/server";
import { logoutUser } from "@/services/auth-server.service";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info("Logout request received");

    // Logout user (clears session cookie)
    const response = await logoutUser();

    logger.info("Logout successful");

    return NextResponse.json(
      {
        success: true,
        message: response.message,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Logout API error: ${appError.message}`, {
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

// Allow GET requests for logout as well (for simple logout links)
export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request);
}
