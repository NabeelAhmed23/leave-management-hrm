import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/schemas/auth.schema";
import { resetPassword } from "@/services/auth-server.service";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = resetPasswordSchema.parse(body);
    const { token, password } = validatedData;

    // Get email from query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    logger.info(`Password reset attempt for email: ${email}`);

    // Reset password
    const result = await resetPassword(token, email, password);

    logger.info(`Password successfully reset for email: ${email}`);

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = AppError.from(error);

    logger.error(`Reset password API error: ${appError.message}`, {
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
