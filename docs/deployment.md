# LANStream Deployment

## Architecture

- **Portal**: Next.js standalone build in Docker container
- **Database**: PostgreSQL via Docker Compose
- **LAN Host**: Node.js daemon (runs on machine with media files)

## Portal Deployment

```bash
# Build
pnpm build

# Docker
docker build -t lanstream-portal .
docker run -p 3000:3000 lanstream-portal
```

## Host Agent

Install LANStream Host once on the physical media machine and launch it. On its
first start it opens the portal's approval page in the default browser. The
signed-in owner approves the displayed device, after which the agent receives
and persists its credential automatically. There are no tokens or generated
commands to copy.

Production installers should register LANStream Host as an auto-start operating
system service (systemd, launchd, or Windows Service Manager) and register the
`lanstream://` URL scheme. Subsequent starts use the saved credential without
user interaction. The credential file is written with owner-only permissions.

### Linux Desktop Installation

Build and install the current host release for the signed-in Linux user with:

```bash
pnpm host:install:linux
```

The installer copies the self-contained host build into
`~/.local/share/lanstream-host`, registers `lanstream-host.desktop` as the
`x-scheme-handler/lanstream` application, and enables
`lanstream-host.service` in the systemd user session. Distribution packages
should run this registration during installation so end users only click the
portal's **Launch LANStream Host** button.

`LANSTREAM_AGENT_TOKEN` remains available only as a headless deployment or
recovery override. Container deployments persist automatic pairing state in the
`host-config` volume; because a container cannot open the desktop browser, open
the approval URL printed in its first-start log.

The agent makes outbound HTTPS requests only. New logical servers assigned to
that host are started automatically; media continues to flow directly over the
LAN.

## Environment Variables

```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
NODE_ENV=production
PORTAL_URL=https://portal.example.com
```

## Docker Compose

See `infrastructure/compose/` for full configuration.

## Standalone Mode

The portal uses `output: 'standalone'` for minimal Docker images.
Static assets are included in the standalone build.

## Database Migrations

Run migrations via:

```bash
# Generate a reviewed migration during development
pnpm db:generate

# Apply committed migrations during deployment
pnpm db:migrate
```
