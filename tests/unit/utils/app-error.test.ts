import { AppError } from "@/utils/app-error";

describe("AppError", () => {
  describe("constructor", () => {
    it("should create an AppError with default status code", () => {
      const error = new AppError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
    });

    it("should create an AppError with custom status code and details", () => {
      const details = { field: "email", issue: "invalid format" };
      const error = new AppError("Validation error", 400, details);

      expect(error.message).toBe("Validation error");
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe("from", () => {
    it("should return the same AppError if input is already AppError", () => {
      const originalError = new AppError("Original error", 400);
      const result = AppError.from(originalError);

      expect(result).toBe(originalError);
    });

    it("should convert SyntaxError to AppError", () => {
      const syntaxError = new SyntaxError("Invalid JSON");
      const result = AppError.from(syntaxError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe("Invalid JSON or syntax error");
      expect(result.statusCode).toBe(400);
      expect(result.details).toEqual({ original: "Invalid JSON" });
    });

    it("should convert TypeError to AppError", () => {
      const typeError = new TypeError("Cannot read property");
      const result = AppError.from(typeError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe("Type error occurred");
      expect(result.statusCode).toBe(400);
      expect(result.details).toEqual({ original: "Cannot read property" });
    });

    it("should convert generic Error to AppError", () => {
      const genericError = new Error("Something went wrong");
      const result = AppError.from(genericError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe("Something went wrong");
      expect(result.statusCode).toBe(500);
    });

    it("should handle unknown error types", () => {
      const unknownError = "string error";
      const result = AppError.from(unknownError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe("Unknown error");
      expect(result.statusCode).toBe(500);
      expect(result.details).toEqual({ original: "string error" });
    });

    it("should handle Prisma errors", () => {
      const prismaError = new Error("Prisma connection failed");
      prismaError.name = "PrismaClientInitializationError";
      const result = AppError.from(prismaError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe("Database error");
      expect(result.statusCode).toBe(500);
      expect(result.details).toEqual({ original: "Prisma connection failed" });
    });
  });
});