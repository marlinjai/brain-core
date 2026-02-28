import type { Context } from 'hono';
import { ZodError } from 'zod';

/**
 * Base API error class shared across Brain services.
 * Services can extend this to add domain-specific static methods.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string) {
    return new ApiError(409, 'CONFLICT', message);
  }

  static quotaExceeded(message = 'Quota exceeded') {
    return new ApiError(403, 'QUOTA_EXCEEDED', message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}

/**
 * Create a typed error handler for Hono.
 * Generic over the app's environment type.
 */
export function createErrorHandler<
  E extends { Bindings: { ENVIRONMENT: string }; Variables: { requestId: string } },
>() {
  return function errorHandler(err: Error, c: Context<E>) {
    const requestId = c.get('requestId') ?? 'unknown';

    // Handle Zod validation errors
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      console.error(`[${requestId}] Validation error:`, JSON.stringify(details));

      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: { errors: details },
          },
        },
        400
      );
    }

    // Handle custom API errors
    if (err instanceof ApiError) {
      console.error(`[${requestId}] API error: ${err.code} - ${err.message}`);

      return c.json(
        {
          error: {
            code: err.code,
            message: err.message,
            ...(err.details && { details: err.details }),
          },
        },
        err.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500
      );
    }

    // Handle unexpected errors
    console.error(`[${requestId}] Unexpected error:`, err);

    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message:
            c.env.ENVIRONMENT === 'production'
              ? 'An unexpected error occurred'
              : (err as Error).message || 'An unexpected error occurred',
        },
      },
      500
    );
  };
}
