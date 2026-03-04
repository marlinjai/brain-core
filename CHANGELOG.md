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
