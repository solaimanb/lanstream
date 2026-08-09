# LANStream Agent Rules

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## LANStream Framework Rules

1. **Inspect installed Next.js version** before framework-sensitive work.
2. **Read version-matched Next.js documentation** when available.
3. **Use App Router only** — no Pages Router conventions.
4. **Keep `src/app` primarily focused on routing** — not general business logic.
5. **Use route groups** for organizational/layout boundaries: `(marketing)`, `(auth)`, `(portal)`.
6. **Use private `_folders`** only for route-local implementation.
7. **Never place `page.tsx` and `route.ts`** in the same route segment.
8. **Keep pages/layouts as Server Components** by default.
9. **Add `"use client"` only** to the smallest interactive boundary.
10. **Never import `src/server`** from a Client Component.
11. **Protect sensitive modules** with `import 'server-only'`.
12. **Server Components read through the DAL** directly — not via fetch.
13. **Do not call the application's own Route Handlers** from Server Components.
14. **Server Actions** handle portal UI mutations.
15. **Route Handlers** handle actual HTTP API boundaries.
16. **Keep Proxy lightweight** — no database queries, no business logic.
17. **Treat `params`/`searchParams`** according to the installed async APIs.
18. **Use `loading.tsx`** on important dynamic routes.
19. **Do not cache host runtime state** — heartbeat, status, IP, etc.
20. **Never send local files or movie bytes** through the global portal.7. **Guest links are LAN-only** — host enforces RFC 1918 private IP check.
8. **`mediaPath` is portal-owned** — stored in server table, read by host during claim.21. **Run lint, typecheck, tests, and build** before declaring work complete.
22. **Update docs** whenever architecture changes.

## Project Structure

```
lanstream/
├── apps/portal/          # Next.js global portal
├── apps/host/            # Node.js LAN Host (Vite build)
├── packages/             # Shared packages
├── infrastructure/       # Docker, compose, scripts
├── docs/                 # Documentation
```

## Portal Structure

```
apps/portal/src/
├── app/                  # Routing composition layer
│   ├── (auth)/           # Auth routes (sign-in, sign-up)
│   ├── (marketing)/      # Public landing page
│   ├── (portal)/         # Authenticated portal routes
│   └── api/              # Route Handlers (HTTP API boundaries)
├── components/           # Reusable UI primitives
│   ├── ui/               # shadcn/ui components (base-nova style)
│   ├── shell/            # Layout shell (sidebar, mobile-header, user-menu)
│   ├── navigation/       # Navigation (breadcrumbs)
│   └── feedback/         # Feedback (status-badge)
├── features/             # Domain-level UI composition
│   ├── access-links/     # Access link management
│   ├── authentication/   # Auth UI
│   ├── guest-permissions/# Guest permission UI
│   ├── host-status/      # Host device info
│   └── servers/          # Server CRUD UI
├── server/               # Trusted backend layer
│   ├── actions/          # Server Actions (portal UI mutations)
│   ├── auth/             # Auth session management
│   ├── dal/              # Data Access Layer
│   ├── db/               # Drizzle schema + migrations
│   ├── guest/            # Guest access logic
│   ├── runtime/          # Host runtime API handlers
│   ├── security/         # Tokens, hashing, rate limiting
│   └── validation/       # Zod schemas (server-side)
├── lib/                  # Small shared utilities
├── hooks/                # Client hooks
├── types/                # Type definitions
├── proxy.ts              # Lightweight pre-routing logic
├── instrumentation.ts    # Server instrumentation
└── instrumentation-client.ts
```

## Dependency Direction

```
app → features/components → server/lib → database/external services
```
