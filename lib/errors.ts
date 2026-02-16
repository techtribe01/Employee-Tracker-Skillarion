// Custom error classes for different error types

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: Record<string, any>) {
    super('AUTH_ERROR', 401, message, details)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: Record<string, any>) {
    super('FORBIDDEN', 403, message, details)
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: Record<string, any>) {
    super('VALIDATION_ERROR', 400, message, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: Record<string, any>) {
    super('NOT_FOUND', 404, message, details)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: Record<string, any>) {
    super('CONFLICT', 409, message, details)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: Record<string, any>) {
    super('RATE_LIMIT', 429, message, details)
    this.name = 'RateLimitError'
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: Record<string, any>) {
    super('SERVER_ERROR', 500, message, details)
    this.name = 'ServerError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: Record<string, any>) {
    super('DATABASE_ERROR', 500, message, details)
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service unavailable', details?: Record<string, any>) {
    super('SERVICE_ERROR', 503, message, details)
    this.name = 'ExternalServiceError'
  }
}

// Error handling utility
export function isAppError(error: any): error is AppError {
  return error instanceof AppError
}

export function getErrorResponse(error: any) {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details || {},
    }
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      statusCode: 500,
      details: {},
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    statusCode: 500,
    details: {},
  }
}
