import { describe, it, expect, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { z } from 'zod';
import { createAuthMiddleware, createAdminAuthMiddleware, createUserAuthMiddleware } from './auth';
import { ApiError } from './errors';
import { timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto';

// Polyfill crypto.subtle.timingSafeEqual for Node.js (CF Workers API)
beforeAll(() => {
  if (!crypto.subtle.timingSafeEqual) {
    (crypto.subtle as Record<string, unknown>).timingSafeEqual = (a: ArrayBuffer, b: ArrayBuffer) => {
      return nodeTimingSafeEqual(Buffer.from(a), Buffer.from(b));
    };
  }
});

// ---------- createAuthMiddleware ----------

describe('createAuthMiddleware', () => {
  const schema = z.string().startsWith('sk_');

  function buildApp(lookupTenant: (c: unknown, key: string) => Promise<unknown>) {
    const app = new Hono();
    app.use('/*', createAuthMiddleware({ apiKeySchema: schema, lookupTenant }));
    app.get('/ok', (c) => c.json({ tenant: c.get('tenant') }));
    app.onError((err, c) => {
      if (err instanceof ApiError) return c.json({ error: err.message }, err.statusCode as 401);
      return c.json({ error: 'unexpected' }, 500);
    });
    return app;
  }

  it('sets tenant on valid API key', async () => {
    const tenant = { id: '1', name: 'Acme' };
    const app = buildApp(async () => tenant);
    const res = await app.request('/ok', {
      headers: { Authorization: 'Bearer sk_abc123' },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tenant });
  });

  it('rejects missing Authorization header', async () => {
    const app = buildApp(async () => null);
    const res = await app.request('/ok');
    expect(res.status).toBe(401);
  });

  it('rejects non-Bearer header', async () => {
    const app = buildApp(async () => null);
    const res = await app.request('/ok', {
      headers: { Authorization: 'Basic abc' },
    });
    expect(res.status).toBe(401);
  });

  it('rejects invalid API key format', async () => {
    const app = buildApp(async () => null);
    const res = await app.request('/ok', {
      headers: { Authorization: 'Bearer bad_key' },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid API key format');
  });

  it('rejects when lookupTenant returns null', async () => {
    const app = buildApp(async () => null);
    const res = await app.request('/ok', {
      headers: { Authorization: 'Bearer sk_nonexistent' },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid API key');
  });
});

// ---------- createAdminAuthMiddleware ----------

describe('createAdminAuthMiddleware', () => {
  function buildApp() {
    const app = new Hono<{ Bindings: { ADMIN_API_KEY?: string } }>();
    app.use('/*', createAdminAuthMiddleware());
    app.get('/admin', (c) => c.json({ ok: true }));
    app.onError((err, c) => {
      if (err instanceof ApiError) return c.json({ error: err.message }, err.statusCode as 401);
      return c.json({ error: 'unexpected' }, 500);
    });
    return app;
  }

  it('passes with correct admin key', async () => {
    const app = buildApp();
    const res = await app.request('/admin', {
      headers: { Authorization: 'Bearer secret' },
    }, { ADMIN_API_KEY: 'secret' });
    expect(res.status).toBe(200);
  });

  it('rejects missing Authorization header', async () => {
    const app = buildApp();
    const res = await app.request('/admin', {}, { ADMIN_API_KEY: 'secret' });
    expect(res.status).toBe(401);
  });

  it('rejects when ADMIN_API_KEY is not configured', async () => {
    const app = buildApp();
    const res = await app.request('/admin', {
      headers: { Authorization: 'Bearer whatever' },
    }, {});
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('not configured');
  });

  it('rejects wrong admin key', async () => {
    const app = buildApp();
    const res = await app.request('/admin', {
      headers: { Authorization: 'Bearer wrong' },
    }, { ADMIN_API_KEY: 'secret' });
    expect(res.status).toBe(401);
  });
});

// ---------- createUserAuthMiddleware ----------

describe('createUserAuthMiddleware', () => {
  const now = Date.now();
  const mockUser = { id: 'u1', email: 'test@example.com', createdAt: now, updatedAt: now };

  function errorHandler(err: Error, c: ReturnType<Hono['request']> extends Promise<infer R> ? never : never) {
    // unused — inline in buildApp
  }

  describe('bearer token source (default)', () => {
    function buildApp(verifyToken: (c: unknown, token: string) => Promise<unknown>) {
      const app = new Hono();
      app.use('/*', createUserAuthMiddleware({ verifyToken }));
      app.get('/me', (c) => c.json({ user: c.get('user') }));
      app.onError((err, c) => {
        if (err instanceof ApiError) return c.json({ error: err.message }, err.statusCode as 401);
        return c.json({ error: 'unexpected' }, 500);
      });
      return app;
    }

    it('sets user on valid Bearer token', async () => {
      const app = buildApp(async () => mockUser);
      const res = await app.request('/me', {
        headers: { Authorization: 'Bearer jwt.token.here' },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ user: mockUser });
    });

    it('rejects missing Authorization header', async () => {
      const app = buildApp(async () => null);
      const res = await app.request('/me');
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('Missing Authorization header');
    });

    it('rejects non-Bearer format', async () => {
      const app = buildApp(async () => null);
      const res = await app.request('/me', {
        headers: { Authorization: 'Basic abc' },
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('Invalid Authorization header format');
    });

    it('rejects when verifyToken returns null', async () => {
      const app = buildApp(async () => null);
      const res = await app.request('/me', {
        headers: { Authorization: 'Bearer bad.token' },
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('Invalid or expired token');
    });

    it('passes token to verifyToken', async () => {
      const spy = vi.fn(async () => mockUser);
      const app = buildApp(spy);
      await app.request('/me', {
        headers: { Authorization: 'Bearer my-jwt-token' },
      });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![1]).toBe('my-jwt-token');
    });
  });

  describe('cookie token source', () => {
    function buildApp(verifyToken: (c: unknown, token: string) => Promise<unknown>) {
      const app = new Hono();
      app.use('/*', createUserAuthMiddleware({
        tokenSource: 'cookie',
        cookieName: 'session',
        verifyToken,
      }));
      app.get('/me', (c) => c.json({ user: c.get('user') }));
      app.onError((err, c) => {
        if (err instanceof ApiError) return c.json({ error: err.message }, err.statusCode as 401);
        return c.json({ error: 'unexpected' }, 500);
      });
      return app;
    }

    it('extracts token from cookie', async () => {
      const app = buildApp(async () => mockUser);
      const res = await app.request('/me', {
        headers: { Cookie: 'session=abc123' },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ user: mockUser });
    });

    it('extracts token from multiple cookies', async () => {
      const spy = vi.fn(async () => mockUser);
      const app = buildApp(spy);
      await app.request('/me', {
        headers: { Cookie: 'other=val; session=the-token; extra=x' },
      });
      expect(spy.mock.calls[0]![1]).toBe('the-token');
    });

    it('handles cookie values with = signs', async () => {
      const spy = vi.fn(async () => mockUser);
      const app = buildApp(spy);
      await app.request('/me', {
        headers: { Cookie: 'session=base64value==' },
      });
      expect(spy.mock.calls[0]![1]).toBe('base64value==');
    });

    it('rejects missing cookie', async () => {
      const app = buildApp(async () => null);
      const res = await app.request('/me');
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('Missing session cookie');
    });

    it('rejects when cookie header exists but target cookie is missing', async () => {
      const app = buildApp(async () => null);
      const res = await app.request('/me', {
        headers: { Cookie: 'other=val' },
      });
      expect(res.status).toBe(401);
    });

    it('rejects when verifyToken returns null', async () => {
      const app = buildApp(async () => null);
      const res = await app.request('/me', {
        headers: { Cookie: 'session=bad' },
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('Invalid or expired token');
    });
  });

  describe('custom contextKey', () => {
    it('stores user under custom key', async () => {
      const app = new Hono();
      app.use('/*', createUserAuthMiddleware({
        verifyToken: async () => mockUser,
        contextKey: 'currentUser',
      }));
      app.get('/me', (c) => c.json({ user: c.get('currentUser') }));
      app.onError((err, c) => {
        if (err instanceof ApiError) return c.json({ error: err.message }, err.statusCode as 401);
        return c.json({ error: 'unexpected' }, 500);
      });
      const res = await app.request('/me', {
        headers: { Authorization: 'Bearer tok' },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ user: mockUser });
    });

    it('default contextKey is "user"', async () => {
      const app = new Hono();
      app.use('/*', createUserAuthMiddleware({
        verifyToken: async () => mockUser,
      }));
      app.get('/me', (c) => c.json({ user: c.get('user') }));
      const res = await app.request('/me', {
        headers: { Authorization: 'Bearer tok' },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ user: mockUser });
    });
  });

  describe('configuration errors', () => {
    it('throws if cookie source is used without cookieName', () => {
      expect(() =>
        createUserAuthMiddleware({
          tokenSource: 'cookie',
          verifyToken: async () => null,
        })
      ).toThrow('cookieName is required');
    });
  });

  describe('explicit bearer tokenSource', () => {
    it('works the same as default', async () => {
      const app = new Hono();
      app.use('/*', createUserAuthMiddleware({
        tokenSource: 'bearer',
        verifyToken: async () => mockUser,
      }));
      app.get('/me', (c) => c.json({ user: c.get('user') }));
      const res = await app.request('/me', {
        headers: { Authorization: 'Bearer tok' },
      });
      expect(res.status).toBe(200);
    });
  });
});
