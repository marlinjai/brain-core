import type { Context, Next } from 'hono';
import type { z } from 'zod';
import { ApiError } from './errors';

export interface AuthMiddlewareOptions<T> {
  /** Zod schema to validate the API key format */
  apiKeySchema: z.ZodType<string>;
  /** Callback to look up a tenant by API key. Return null if not found. */
  lookupTenant: (c: Context, apiKey: string) => Promise<T | null>;
}

/**
 * Create a tenant auth middleware.
 * Extracts Bearer token, validates format, looks up tenant, and sets it on context.
 */
export function createAuthMiddleware<T>(options: AuthMiddlewareOptions<T>) {
  return async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      throw ApiError.unauthorized('Missing Authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Invalid Authorization header format. Expected: Bearer {api_key}');
    }

    const apiKey = authHeader.slice(7);

    const parseResult = options.apiKeySchema.safeParse(apiKey);
    if (!parseResult.success) {
      throw ApiError.unauthorized('Invalid API key format');
    }

    const tenant = await options.lookupTenant(c, apiKey);

    if (!tenant) {
      throw ApiError.unauthorized('Invalid API key');
    }

    c.set('tenant', tenant);

    await next();
  };
}

/**
 * Create an admin auth middleware.
 * Compares Bearer token against ADMIN_API_KEY using constant-time comparison.
 */
export function createAdminAuthMiddleware() {
  return async function adminAuthMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing admin key');
    }

    const key = authHeader.slice(7);
    const adminKey = c.env.ADMIN_API_KEY as string | undefined;

    if (!adminKey) {
      throw ApiError.unauthorized('Admin endpoint not configured');
    }

    const encoder = new TextEncoder();
    const a = encoder.encode(key);
    const b = encoder.encode(adminKey);

    if (a.byteLength !== b.byteLength) {
      throw ApiError.unauthorized('Invalid admin key');
    }

    const isEqual = crypto.subtle.timingSafeEqual(a, b);
    if (!isEqual) {
      throw ApiError.unauthorized('Invalid admin key');
    }

    await next();
  };
}
