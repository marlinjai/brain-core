/**
 * Base error class for Brain SDK clients.
 * Service-specific SDKs extend this with domain-specific errors.
 */
export class BrainSdkError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BrainSdkError';
  }
}

/**
 * Authentication error - invalid or missing API key
 */
export class AuthenticationError extends BrainSdkError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends BrainSdkError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error - request validation failed
 */
export class ValidationError extends BrainSdkError {
  constructor(
    message: string,
    public errors?: Array<{ path: string; message: string }>
  ) {
    super(message, 'VALIDATION_ERROR', 400, { errors });
    this.name = 'ValidationError';
  }
}

/**
 * Quota exceeded error
 */
export class QuotaExceededError extends BrainSdkError {
  constructor(message = 'Quota exceeded') {
    super(message, 'QUOTA_EXCEEDED', 403);
    this.name = 'QuotaExceededError';
  }
}

/**
 * Network error - connection issues
 */
export class NetworkError extends BrainSdkError {
  constructor(message = 'Network error occurred', public originalError?: Error) {
    super(message, 'NETWORK_ERROR', undefined, { originalError: originalError?.message });
    this.name = 'NetworkError';
  }
}

/**
 * Conflict error - resource already exists or version mismatch
 */
export class ConflictError extends BrainSdkError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}
