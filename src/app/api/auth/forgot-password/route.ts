import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/schemas/auth.schema";
import { initiatePasswordReset } from "@/services/auth-server.service";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = forgotPasswordSchema.parse(body);
    const { email } = validatedData;

    logger.info(`Password reset requested for email: ${email}`);

    // Initiate password reset
    const result = await initiatePasswordReset(email);

    logger.info(`Password reset process initiated for email: ${email}`);

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Forgot password API error: ${appError.message}`, {
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
