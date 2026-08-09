# LANStream Security Model

## Authentication

- **Portal**: Better Auth with email/password (1.6.26)
- **Session tokens**: Managed server-side, validated via proxy
- **Auth routes**: `/api/auth/[...all]` catch-all
- **Proxy redirects**: Authenticated users away from sign-in; unauthenticated users away from portal

## Authorization

- **Server ownership**: Verified at DAL level before every mutation
- **Access links**: Scoped to specific servers with optional expiry
- **Owner-only operations**: Enforced consistently in DAL functions

## Secrets Management

- Environment variables validated in `src/lib/env.ts`
- No secrets use `NEXT_PUBLIC_` prefix
- `server-only` import protection on all sensitive modules
- Database credentials never exposed to client components

## Access Tokens

Host agents use a device-authorization flow. Pairing secrets and user codes are
hashed at rest, expire after ten minutes, and can be consumed once. The durable
agent token is returned only to the polling host process after an authenticated
owner approves the matching code; it is never rendered in the portal UI. The
host persists that token in a file restricted to its operating-system user.

- Temporary tokens for guest file access
- Hashed with SHA-256 before storage
- Revocable via portal UI
- Expiration enforced on every request
- Token format: `lanst_<nanoid>` — 21-char URL-safe ID

## Network Security

- Security headers applied via proxy:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 0`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **LAN-only enforcement**: Host file server rejects non-RFC 1918 private IPs (10.x, 172.16-31.x, 192.168.x)
- **Media path portal-owned**: Stored in server table, read by host during claim — not hardcoded
- LAN Host validates tokens on every request
- No file data flows through the global portal

## Rate Limiting

- In-memory sliding window rate limiter
- Applied to auth endpoints and protocol endpoints
- Returns `allowed`, `remaining`, `resetAt` on every check

## Token Security

- **Hashing**: SHA-256 via `src/server/security/hashing.ts`
- **Timing-safe comparison**: Prevents timing attacks on token verification
- **Random generation**: Cryptographically secure via `crypto.randomBytes`
- **Bearer extraction**: Safe parsing from Authorization header

## Audit Trail

- Append-only `audit_event` table
- Events logged for: server claim, release, access link creation/revocation
- Non-blocking: audit failures don't affect the operation
