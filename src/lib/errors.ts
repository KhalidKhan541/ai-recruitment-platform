export class AppError extends Error {
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

  static notImplemented(message: string = "Not implemented"): AppError {
    return new AppError(message, 501, "NOT_IMPLEMENTED", false);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("Validation failed", 422, "VALIDATION_ERROR");
    this.errors = errors;
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class DuplicateError extends ConflictError {
  constructor(resource: string = "Resource") {
    super(`${resource} already exists`);
  }
}

export function handleApiError(error: unknown): {
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
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message,
      code: "INTERNAL_ERROR",
    };
  }

  return {
    statusCode: 500,
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
  };
}
