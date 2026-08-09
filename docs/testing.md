# LANStream Testing Strategy

## Test Types

### Unit Tests (Vitest 4)

All unit tests use Vitest with globals enabled and `@` path alias.

**Portal** (`apps/portal/src/**/*.test.ts`):

- `src/lib/result.test.ts` — Result type helpers
- `src/lib/constants.test.ts` — Application constants
- `src/server/validation/servers.test.ts` — Server CRUD schemas
- `src/server/validation/runtime.test.ts` — Claim/heartbeat/release schemas
- `src/server/security/tokens.test.ts` — Token generation, hashing, verification
- `src/server/security/hashing.test.ts` — SHA-256, timing-safe comparison
- `src/server/security/rate-limit.test.ts` — Sliding window rate limiter
- `src/proxy.test.ts` — Security headers, auth redirects

**Host** (`apps/host/src/**/*.test.ts`):

- `src/config.test.ts` — Config validation
- `src/device-info.test.ts` — Device info collection

### E2E Tests (Playwright)

- `apps/portal/tests/e2e/marketing.spec.ts` — Landing page rendering
- `apps/portal/tests/e2e/auth.spec.ts` — Auth flows, redirects
- `apps/portal/tests/e2e/api.spec.ts` — Health endpoint

## Running Tests

```bash
# All tests across workspaces
pnpm test

# Portal unit tests
pnpm test:portal

# Host unit tests
pnpm test:host

# E2E tests (requires running dev server + DB)
pnpm test:e2e

# Watch mode (portal)
cd apps/portal && pnpm test:watch

# With Playwright UI
cd apps/portal && pnpm exec playwright test --ui
```

## Conventions

- Test files use `.test.ts` for unit/integration
- E2E tests use `.spec.ts`
- Place test files in `tests/` directory
- Co-locate test helpers near test files
