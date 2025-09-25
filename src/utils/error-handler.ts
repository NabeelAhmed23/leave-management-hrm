import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./app-error";

export function handleApiError(error: unknown): NextResponse {
  const appError = AppError.from(error);

  console.error(`[API Error] ${appError.message}`, {
    statusCode: appError.statusCode,
    details: appError.details,
    stack: appError.stack,
  });

  return NextResponse.json(
    {
      error: appError.message,
      statusCode: appError.statusCode,
    },
    { status: appError.statusCode }
  );
}

export function withErrorHandling<T extends any[]>(
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