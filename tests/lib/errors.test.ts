import { describe, it, expect } from "vitest";

class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, code?: string): AppError {
    return new AppError(message, 400, code ?? "BAD_REQUEST");
  }

  static unauthorized(message: string = "Unauthorized", code?: string): AppError {
    return new AppError(message, 401, code ?? "UNAUTHORIZED");
  }

  static forbidden(message: string = "Forbidden", code?: string): AppError {
    return new AppError(message, 403, code ?? "FORBIDDEN");
  }

  static notFound(message: string = "Not found", code?: string): AppError {
    return new AppError(message, 404, code ?? "NOT_FOUND");
  }

  static conflict(message: string, code?: string): AppError {
    return new AppError(message, 409, code ?? "CONFLICT");
  }

  static validation(message: string, code?: string): AppError {
    return new AppError(message, 422, code ?? "VALIDATION_ERROR");
  }

  static rateLimited(message: string = "Too many requests"): AppError {
    return new AppError(message, 429, "RATE_LIMITED");
  }

  static internal(message: string = "Internal server error"): AppError {
    return new AppError(message, 500, "INTERNAL_ERROR", false);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("Validation failed", 422, "VALIDATION_ERROR");
    this.errors = errors;
  }
}

class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

function handleApiError(error: unknown): {
  statusCode: number;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
} {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      ...(error instanceof ValidationError && { errors: error.errors }),
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
      code: "INTERNAL_ERROR",
    };
  }

  return {
    statusCode: 500,
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
  };
}

describe("AppError", () => {
  it("creates error with default values", () => {
    const error = new AppError("Test error");
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.isOperational).toBe(true);
  });

  it("creates error with custom values", () => {
    const error = new AppError("Custom error", 400, "CUSTOM_CODE", false);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("CUSTOM_CODE");
    expect(error.isOperational).toBe(false);
  });

  it("is instance of Error", () => {
    const error = new AppError("Test");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe("Error factories", () => {
  it("creates bad request error", () => {
    const error = AppError.badRequest("Invalid input");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
  });

  it("creates unauthorized error", () => {
    const error = AppError.unauthorized();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("creates forbidden error", () => {
    const error = AppError.forbidden();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("creates not found error", () => {
    const error = AppError.notFound();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("creates conflict error", () => {
    const error = AppError.conflict("Already exists");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
  });

  it("creates validation error", () => {
    const error = AppError.validation("Invalid data");
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("creates rate limited error", () => {
    const error = AppError.rateLimited();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe("RATE_LIMITED");
  });

  it("creates internal error", () => {
    const error = AppError.internal();
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(false);
  });
});

describe("Specific error classes", () => {
  it("NotFoundError includes resource name", () => {
    const error = new NotFoundError("User");
    expect(error.message).toBe("User not found");
    expect(error.statusCode).toBe(404);
  });

  it("UnauthorizedError has default message", () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe("Authentication required");
  });

  it("ForbiddenError has default message", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
  });

  it("ValidationError stores field errors", () => {
    const errors = { email: ["Invalid email"], name: ["Required"] };
    const error = new ValidationError(errors);
    expect(error.errors).toEqual(errors);
    expect(error.statusCode).toBe(422);
  });

  it("ConflictError has default message", () => {
    const error = new ConflictError();
    expect(error.message).toBe("Resource already exists");
  });
});

describe("handleApiError", () => {
  it("handles AppError", () => {
    const error = AppError.badRequest("Test");
    const result = handleApiError(error);
    expect(result.statusCode).toBe(400);
    expect(result.message).toBe("Test");
  });

  it("handles ValidationError with errors", () => {
    const errors = { field: ["Error"] };
    const error = new ValidationError(errors);
    const result = handleApiError(error);
    expect(result.errors).toEqual(errors);
  });

  it("handles generic Error", () => {
    const error = new Error("Something went wrong");
    const result = handleApiError(error);
    expect(result.statusCode).toBe(500);
    expect(result.code).toBe("INTERNAL_ERROR");
  });

  it("handles unknown error types", () => {
    const result = handleApiError("string error");
    expect(result.statusCode).toBe(500);
    expect(result.code).toBe("UNKNOWN_ERROR");
  });

  it("hides error details in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const error = new Error("Sensitive error details");
    const result = handleApiError(error);
    expect(result.message).toBe("Internal server error");

    process.env.NODE_ENV = originalEnv;
  });
});
