export interface NormalizedError {
  statusCode: number;
  message: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  public statusCode: number;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  static from(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof SyntaxError) {
      return new AppError("Invalid JSON or syntax error", 400, {
        original: error.message,
      });
    }

    if (error instanceof TypeError) {
      return new AppError("Type error occurred", 400, {
        original: error.message,
      });
    }

    if (error instanceof Error) {
      if (error.name.includes("Prisma") || error.name.includes("Sequelize")) {
        return new AppError("Database error", 500, { original: error.message });
      }
      return new AppError(error.message, 500);
    }

    return new AppError("Unknown error", 500, { original: error });
  }
}
