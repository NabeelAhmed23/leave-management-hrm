import { NextRequest, NextResponse } from "next/server";
import { setupPassword } from "@/services/employee-server.service";
import { setupPasswordSchema } from "@/schemas/employee.schema";
import { AppError } from "@/utils/app-error";
import { logger } from "@/services/logger.service";

/**
 * POST /api/employees/setup-password - Set up password from invite token
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = setupPasswordSchema.parse(body);

    logger.info("Setting up password from invite token");

    // Setup password
    const result = await setupPassword(validatedData);

    logger.info("Password setup completed successfully");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error("Error in POST /api/employees/setup-password:", {
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
