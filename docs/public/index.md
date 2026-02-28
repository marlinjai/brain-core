---
title: Brain Core
description: Shared infrastructure for Brain services
order: 0
icon: cpu
---

# Brain Core

Shared infrastructure library used by all Brain services (Storage Brain, Data Brain). Provides common auth, crypto, error handling, types, and validation schemas.

## Features

- **Auth Middleware** — Factory functions for API key authentication (`createAuthMiddleware`, `createAdminAuthMiddleware`)
- **Crypto Utilities** — API key generation, hashing, and verification with timing-safe comparison
- **Error Handling** — Standardized `ApiError` class and `createErrorHandler` factory
- **Base Types** — `BaseTenant`, `BaseWorkspace`, `BaseTenantContext`, and shared env bindings
- **Validation Schemas** — Reusable Zod schemas for UUIDs, API keys, cursors, and workspace slugs

## Exports

Brain Core has two entry points:

| Entry Point | Import Path | Use Case |
|-------------|------------|----------|
| Server | `@marlinjai/brain-core` | API workers (auth, crypto, errors, types) |
| SDK | `@marlinjai/brain-core/sdk` | Client SDKs (errors, retry config, constants) |

## Usage

```typescript
// Server-side (Cloudflare Worker)
import { createAuthMiddleware, ApiError, generateApiKey } from '@marlinjai/brain-core';

// Client SDK
import { BrainSdkError, RETRY_CONFIG } from '@marlinjai/brain-core/sdk';
```
