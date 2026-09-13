# 1.0.0 (2026-09-13)


### Bug Fixes

* add Node.js fallback for timingSafeEqual in admin auth ([e2e2799](https://github.com/marlinjai/brain-core/commit/e2e2799443e2dfe3c542752579f182b5b53f4767))
* **ci:** switch docs deploy to 1Password + direct wrangler ([208e0e8](https://github.com/marlinjai/brain-core/commit/208e0e8f85291e1862ae92b97d2df3c13ada3f30))
* **ci:** update clearify to 1.11.2 for SSR pre-rendering fix ([4c642d4](https://github.com/marlinjai/brain-core/commit/4c642d46f86e4b4b47054e6809118158fa6d387f))


### Features

* add createUserAuthMiddleware for user-facing JWT/session auth (v0.2.0) ([4fffdac](https://github.com/marlinjai/brain-core/commit/4fffdacecb3ded9e2d6466f744509834ea8d25ff))
* initial @marlinjai/brain-core package ([8c99b33](https://github.com/marlinjai/brain-core/commit/8c99b33c254352fb47e2329688774760e35f5f7c))

---
title: Brain Core Changelog
summary: Version history for Brain Core shared infrastructure package, tracking releases from v0.1.0 through v0.2.0 including auth middlewares, crypto utilities, error handling, and base types for Brain services.
type: changelog
tags: [brain-core, changelog, releases, infrastructure]
date: 2026-03-04
---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-03-04

### Added
- `createUserAuthMiddleware` factory — supports Bearer token and cookie-based token extraction via `tokenSource` option, configurable `contextKey` (default: `'user'`), and `verifyToken` callback
- `UserAuthMiddlewareOptions` interface for configuring user auth middleware
- `BaseUser` type (id, email, createdAt, updatedAt) — base interface for user entities
- `BaseUserContext` type — user context attached to authenticated requests
- Vitest test suite with comprehensive tests for all auth middlewares
- `test` and `test:watch` scripts in package.json

## [0.1.1] - 2026-03-02

### Changed

- Docs hub backlink now points to Lumitra Cloud (`docs.cloud.lumitra.co`) instead of ERP Suite root

## [0.1.0] - 2026-02-28

### Added
- Initial `@marlinjai/brain-core` package with shared infrastructure for Brain services (auth, crypto, errors, types, constants, schemas)

### Changed
- Add `.gitignore`, public docs, and lock file
- Add `packageManager` field for pnpm standardization

### Fixed
- Fix sidebar emoji rendering — use Unicode instead of text names in docs
