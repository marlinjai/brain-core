import type { Context, Next } from 'hono';
import type { z } from 'zod';
import { ApiError } from './errors';

export interface AuthMiddlewareOptions<T> {
  /** Zod schema to validate the API key format */
  apiKeySchema: z.ZodType<string>;
  /** Callback to look up a tenant by API key. Return null if not found. */
  lookupTenant: (c: Context, apiKey: string) => Promise<T | null>;
}

export interface UserAuthMiddlewareOptions<U> {
  /** Callback to verify/decode the token and return a user. Return null if invalid. */
  verifyToken: (c: Context, token: string) => Promise<U | null>;
  /** How to extract the token: 'bearer' (Authorization header) or 'cookie'. Default: 'bearer'. */
  tokenSource?: 'bearer' | 'cookie';
  /** Cookie name to read the token from. Required when tokenSource is 'cookie'. */
  cookieName?: string;
  /** Hono context key to store the user on. Default: 'user'. */
  contextKey?: string;
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

/**
 * Create a user auth middleware.
 * Extracts token from Bearer header or cookie, verifies via callback, and sets user on context.
 */
export function createUserAuthMiddleware<U>(options: UserAuthMiddlewareOptions<U>) {
  const source = options.tokenSource ?? 'bearer';
  const key = options.contextKey ?? 'user';

  if (source === 'cookie' && !options.cookieName) {
    throw new Error('cookieName is required when tokenSource is "cookie"');
  }

  return async function userAuthMiddleware(c: Context, next: Next) {
    let token: string | undefined;

    if (source === 'bearer') {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        throw ApiError.unauthorized('Missing Authorization header');
      }
      if (!authHeader.startsWith('Bearer ')) {
        throw ApiError.unauthorized('Invalid Authorization header format. Expected: Bearer {token}');
      }
      token = authHeader.slice(7);
    } else {
      const cookieHeader = c.req.header('Cookie');
      if (cookieHeader) {
        const match = cookieHeader
          .split(';')
          .map((s) => s.trim())
          .find((s) => s.startsWith(`${options.cookieName!}=`));
        token = match?.split('=').slice(1).join('=');
      }
    }

    if (!token) {
      throw ApiError.unauthorized(
        source === 'bearer' ? 'Missing authentication token' : `Missing ${options.cookieName!} cookie`
      );
    }

    const user = await options.verifyToken(c, token);

    if (!user) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    c.set(key, user);

    await next();
  };
}
