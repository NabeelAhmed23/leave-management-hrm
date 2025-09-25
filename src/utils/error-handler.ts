import { NextResponse } from "next/server";
import { AppError } from "./app-error";
import { logger } from "../lib/logger";

export function handleApiError(error: unknown): NextResponse {
  const appError = AppError.from(error);

  logger.error("API Error occurred", {
    error: appError,
    statusCode: appError.statusCode,
    details: appError.details,
    action: "handle_api_error",
  });

  return NextResponse.json(
    {
      error: appError.message,
      statusCode: appError.statusCode,
    },
    { status: appError.statusCode }
  );
}

export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
