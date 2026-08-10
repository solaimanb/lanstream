# LANStream

A self-hosted LAN media streaming platform. Stream your personal media library to any device on your local network — no cloud required.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Portal (Next.js 16)                │
│  Global management UI — runs on any machine     │
│  PostgreSQL · Better Auth · Drizzle ORM         │
└────────────────┬────────────────────────────────┘
                 │  HTTP API (claim/heartbeat/release)
┌────────────────▼────────────────────────────────┐
│              LAN Host (Node.js)                 │
│  Runs on the machine with your media files      │
│  File server · Vite build · Protocol client     │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
lanstream/
├── apps/
│   ├── portal/              # Next.js global portal (App Router)
│   │   ├── src/app/         # Route composition layer
│   │   ├── src/components/  # Reusable UI primitives
│   │   ├── src/features/    # Domain-level UI composition
│   │   ├── src/server/      # Trusted backend layer (DAL, auth, security)
│   │   └── src/lib/         # Small shared utilities
│   └── host/                # Node.js LAN Host (Vite)
│       ├── src/             # Config, protocol client, file server, heartbeat
│       └── guest/           # React guest page (Vite-built SPA)
├── packages/
│   ├── protocol/            # Shared types for portal↔host communication
│   ├── eslint-config/       # Shared ESLint base config
│   └── typescript-config/   # Shared tsconfig presets (base/nextjs/react/node)
├── infrastructure/
│   ├── docker/              # Dockerfiles (portal, host)
│   ├── compose/             # Docker Compose (dev, prod)
│   ├── scripts/             # Migration & env scripts
│   └── caddy/               # Reverse proxy config
└── docs/                    # Documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+ (or Docker)

### Development

```bash
# 1. Start the database
docker compose -f infrastructure/compose/compose.dev.yaml up -d

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp infrastructure/scripts/env.example apps/portal/.env.local
# Edit .env.local with your database URL and auth secret

# 4. Run database migrations
pnpm db:push

# 5. Start the dev server
pnpm dev
```

### Testing

```bash
# Unit tests (all workspaces)
pnpm test

# Portal tests only
pnpm test:portal

# Host tests only
pnpm test:host

# E2E tests (requires running dev server + DB)
pnpm test:e2e

# Lint all workspaces
pnpm lint

# Typecheck all workspaces
pnpm typecheck
```

### Production Deployment (VPS)

```
┌─────────────────────────────┐
│          YOUR VPS           │
│                             │
│  ┌──────────┐ ┌──────────┐  │
│  │ Portal   │ │PostgreSQL│  │   ← Docker Compose
│  │  :3000   │ │  :5432   │  │
│  └──────────┘ └──────────┘  │
└─────────────────────────────┘
         ▲ HTTPS (outbound only)
         │
┌─────────────────────────────┐
│     YOUR LAN MACHINE        │
│  (media files live here)    │
│                             │
│  ┌───────────────────────┐  │
│  │   LAN Host  :4780     │  │   ← systemd service
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**VPS (Portal + DB):**

```bash
# Clone and configure
git clone <repo-url> && cd lanstream
cp infrastructure/scripts/env.example .env

# Generate secrets
sed -i "s|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=$(openssl rand -base64 32)|" .env
sed -i "s|BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$(openssl rand -base64 48)|" .env

# Set your public domain
sed -i "s|BETTER_AUTH_URL=.*|BETTER_AUTH_URL=https://your-domain.com|" .env
sed -i "s|PORTAL_URL=.*|PORTAL_URL=https://your-domain.com|" .env

# Start
cd infrastructure/compose
docker compose -f compose.prod.yaml up -d
```

Put **Caddy** or **nginx** in front for HTTPS:

```bash
# Caddy example
sudo tee /etc/caddy/Caddyfile <<'EOF'
your-domain.com {
    reverse_proxy localhost:3000
}
EOF
sudo systemctl reload caddy
```

**LAN Host (media machine):**

```bash
# Build
pnpm install
pnpm --filter host build

# Linux desktop (auto-start + browser pairing)
pnpm host:install:linux

# Or run manually
LANSTREAM_PORTAL_URL=https://your-domain.com node apps/host/dist/main.js
```

**Pair and share:**
1. Open `https://your-domain.com` → sign up
2. Go to **Host Machines** → approve the pending host
3. Create a server with a media path (e.g. `/home/user/Movies`)
4. Create an access link → share the URL with LAN guests

## Tech Stack

| Layer          | Technology                            |
| -------------- | ------------------------------------- |
| Portal         | Next.js 16, React 19, TypeScript 5.9  |
| UI Components  | shadcn/ui (base-nova, @base-ui/react) |
| Forms          | React Hook Form + Zod v4              |
| Styling        | Tailwind CSS v4 (oklch tokens)        |
| Database       | PostgreSQL 16, Drizzle ORM            |
| Auth           | Better Auth (email/password)          |
| Host           | Node.js 20, Vite, Zod                 |
| Testing        | Vitest 4, Playwright                  |
| Infrastructure | Docker, Docker Compose, Caddy         |

## Key Features

- **Multi-user**: Each user manages their own servers
- **Access Links**: Generate revocable tokens for guest streaming
- **Live Status**: Real-time server status via heartbeat protocol
- **File Streaming**: HTTP Range requests for video/audio playback
- **Guest Page**: React file browser with inline media playback (Vite-built)
- **LAN-only**: Host enforces RFC 1918 private IP checks on guest access
- **Security**: Security headers, rate limiting, timing-safe comparisons

## Protocol

The portal and host communicate via HTTP:

1. **Pair** — On first launch, the host opens a short-lived browser approval;
   after approval it receives and stores its durable credential automatically
2. **Reconcile** — Heartbeats return desired server assignments
3. **Run** — The agent starts/stops local listeners and reports their status

See `packages/protocol/src/index.ts` for shared type definitions.

## Environment Variables

### Portal (VPS)

| Variable             | Required | Default                 | Description                  |
| -------------------- | -------- | ----------------------- | ---------------------------- |
| `DATABASE_URL`       | ✅       | —                       | PostgreSQL connection string |
| `DATABASE_PASSWORD`  | ✅       | —                       | Postgres password (prod)     |
| `BETTER_AUTH_SECRET` | ✅       | —                       | Auth secret (min 32 chars)   |
| `BETTER_AUTH_URL`    | —        | `PORTAL_URL`            | Auth callback URL            |
| `PORTAL_URL`         | —        | `http://localhost:3000` | Public portal URL            |
| `NODE_ENV`           | —        | `development`           | Environment mode             |

### LAN Host (media machine)

| Variable                | Required | Default | Description                             |
| ----------------------- | -------- | ------- | --------------------------------------- |
| `LANSTREAM_PORTAL_URL`  | ✅       | —       | URL of the portal (for pairing)         |
| `LANSTREAM_AGENT_TOKEN` | —        | —       | Recovery token for headless pairing     |
| `LANSTREAM_PORT`        | —        | `4780`  | Port for the file server                |
| `LANSTREAM_MEDIA_PATH`  | —        | —       | Default media directory                 |

## Documentation

- [Architecture](docs/architecture.md)
- [Cloud API](docs/cloud-api.md)
- [Host API](docs/host-api.md)
- [Security](docs/security.md)
- [Deployment](docs/deployment.md)
- [Testing](docs/testing.md)
- [Release Process](docs/release-process.md)
