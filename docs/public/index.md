---
title: Brain Core
description: Shared infrastructure for Brain services
order: 0
icon: "⚙️"
summary: Documentation for Brain Core, the shared infrastructure library providing auth middleware, crypto utilities, error handling, types, and validation schemas for all Brain services.
type: documentation
tags: [brain-core, infrastructure, auth, crypto, shared-library]
projects: [brain-core]
---

# Brain Core

Shared infrastructure library used by all Brain services (Storage Brain, Data Brain). Provides common auth, crypto, error handling, types, and validation schemas.

## Features

- **Auth Middleware** — Factory functions for API key authentication (`createAuthMiddleware`, `createAdminAuthMiddleware`) and user/session authentication (`createUserAuthMiddleware`)
- **Crypto Utilities** — API key generation, hashing, and verification with timing-safe comparison
- **Error Handling** — Standardized `ApiError` class with static factory methods and `createErrorHandler` factory
- **Base Types** — `BaseTenant`, `BaseWorkspace`, `BaseTenantContext`, `BaseUser`, `BaseUserContext`, `BaseAppEnv`, `BaseVariables`, `ApiErrorResponse`, and shared env bindings
- **Validation Schemas** — Reusable Zod schemas for UUIDs, API keys, cursors, and workspace slugs

## Exports

Brain Core has two entry points:

| Entry Point | Import Path | Use Case |
|-------------|------------|----------|
| Server | `@marlinjai/brain-core` | API workers (auth, crypto, errors, types, schemas) |
| SDK | `@marlinjai/brain-core/sdk` | Client SDKs (errors, retry config, constants) |

### Server Exports

**Auth Middleware:**
- `createAuthMiddleware(options: AuthMiddlewareOptions)` — tenant API key authentication
- `createAdminAuthMiddleware()` — admin API key authentication (constant-time comparison)
- `createUserAuthMiddleware(options: UserAuthMiddlewareOptions)` — user/session token authentication (Bearer or cookie)

**Auth Types:**
- `AuthMiddlewareOptions<T>` — config for tenant auth (apiKeySchema, lookupTenant callback)
- `UserAuthMiddlewareOptions<U>` — config for user auth (verifyToken callback, tokenSource, cookieName, contextKey)

**Error Handling:**
- `ApiError` — base API error class with `statusCode`, `code`, `message`, and optional `details`
- `createErrorHandler()` — Hono error handler factory (handles ApiError, ZodError, and unexpected errors)

**ApiError Static Factory Methods:**

| Method | Status | Code |
|--------|--------|------|
| `ApiError.badRequest(message, details?)` | 400 | `BAD_REQUEST` |
| `ApiError.unauthorized(message?)` | 401 | `UNAUTHORIZED` |
| `ApiError.forbidden(message?)` | 403 | `FORBIDDEN` |
| `ApiError.notFound(message?)` | 404 | `NOT_FOUND` |
| `ApiError.conflict(message)` | 409 | `CONFLICT` |
| `ApiError.quotaExceeded(message?)` | 403 | `QUOTA_EXCEEDED` |
| `ApiError.internal(message?)` | 500 | `INTERNAL_ERROR` |

**Base Types:**
- `BaseTenant` — tenant with id, name, apiKeyHash, timestamps
- `BaseWorkspace` — workspace with id, tenantId, name, slug, metadata
- `BaseTenantContext<T>` — context with tenant attached
- `BaseUser` — user with id, email, timestamps
- `BaseUserContext<U>` — context with user attached
- `BaseVariables<T>` — Hono variables (tenant + requestId)
- `BaseAppEnv<B, V>` — Hono AppEnv type generic over Bindings and Variables
- `BaseEnv` — base environment bindings (DB, ENVIRONMENT, ADMIN_API_KEY)
- `ApiErrorResponse` — standard error response shape (`{ error: { code, message, details? } }`)

### SDK Exports

**Error Classes:**

| Class | Code | Status | Use Case |
|-------|------|--------|----------|
| `BrainSdkError` | (base class) | — | Base error for all SDK errors |
| `AuthenticationError` | `AUTHENTICATION_ERROR` | 401 | Invalid or missing API key |
| `NotFoundError` | `NOT_FOUND` | 404 | Resource not found |
| `ValidationError` | `VALIDATION_ERROR` | 400 | Request validation failed |
| `QuotaExceededError` | `QUOTA_EXCEEDED` | 403 | Quota limit reached |
| `NetworkError` | `NETWORK_ERROR` | — | Connection issues |
| `ConflictError` | `CONFLICT` | 409 | Resource already exists or version mismatch |

## Usage

```typescript
// Server-side (Cloudflare Worker)
import { createAuthMiddleware, ApiError, generateApiKey } from '@marlinjai/brain-core';

// Client SDK
import { BrainSdkError, RETRY_CONFIG } from '@marlinjai/brain-core/sdk';
```
