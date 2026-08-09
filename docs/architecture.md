# LANStream Architecture

## Overview

LANStream consists of three main components:

1. **Global Portal** — Next.js 16.3 web application for managing servers, users, and access links
2. **LAN Host** — Node.js daemon that runs on the user's machine and serves media
3. **PostgreSQL Database** — Persistent storage for portal data

See the [README](../README.md) for the full project structure.

## Portal Technology Stack

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Framework | Next.js 16 (App Router, Turbopack)                     |
| UI        | shadcn/ui (base-nova style, @base-ui/react primitives) |
| Forms     | React Hook Form + Zod + shadcn Field components        |
| Styling   | Tailwind CSS v4 (CSS-native config, oklch tokens)      |
| Database  | PostgreSQL 16, Drizzle ORM 0.45                        |
| Auth      | Better Auth 1.6.26 (email/password)                    |
| Testing   | Vitest 4, Playwright                                   |

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Internet                         │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │         LANStream Portal (Next.js)          │    │
│  │                                             │    │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  │    │
│  │  │  Pages  │  │   API    │  │  Server  │  │    │
│  │  │ (SSR)   │  │  Routes  │  │ Actions  │  │    │
│  │  └────┬────┘  └────┬─────┘  └────┬─────┘  │    │
│  │       │            │             │         │    │
│  │       └────────────┼─────────────┘         │    │
│  │                    │                       │    │
│  │              ┌─────┴─────┐                 │    │
│  │              │   DAL     │                 │    │
│  │              └─────┬─────┘                 │    │
│  └────────────────────┼───────────────────────┘    │
│                       │                            │
│                 ┌─────┴─────┐                      │
│                 │ PostgreSQL │                      │
│                 └───────────┘                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  Local Network (LAN)                │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │          LAN Host (Node.js/Vite)            │    │
│  │                                             │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │    │
│  │  │ Protocol │  │ Heartbeat│  │ File     │ │    │
│  │  │ Client   │  │ Scheduler│  │ Server   │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘ │    │
│  └─────────────────────────────────────────────┘    │
│                       │                            │
│              Guest Browser Access                  │
│         (via temporary access links)               │
└─────────────────────────────────────────────────────┘
```

## Data Flow

### Host Pairing and Automatic Start

1. An unconfigured LAN Host creates a short-lived device authorization request
   and opens the portal approval page in the default browser.
2. The signed-in owner approves the matching code. The waiting host receives a
   durable credential directly and saves it with owner-only file permissions.
3. The installed host remains active as an OS service; future starts reconnect
   without user interaction.
4. Creating a server assigns it to a paired host with desired state `running`.
5. The host heartbeat receives the assignment, validates the local media path,
   and starts the LAN listener automatically.
6. The agent reports runtime state; the portal transitions from `starting` to
   `online`. Offline agents reconcile pending assignments when they reconnect.

One agent manages all logical servers on its physical device. The portal never
attempts to spawn a process on the browser or portal machine.

### Heartbeat Cycle

1. A paired LAN Host sends an outbound heartbeat every 10s to the portal
2. Portal updates host status, IP, and capabilities
3. Portal marks host offline if no heartbeat for 90s

### Guest Access

1. Portal generates temporary access link with token
2. Guest opens the host-served React player → browser connects to LAN Host (local network only)
3. The player calls the host's same-origin file and stream endpoints
4. Host validates token AND verifies request IP is RFC 1918 private
5. Host serves requested files (media path configured by portal owner)
6. Token expires or is revoked → access denied

### Media Path Configuration

1. Server owner creates server with name + local directory path
2. Portal stores `mediaPath` in the server record
3. Host receives `mediaPath` as part of its desired server assignments
4. Host serves files from that directory on the local network

### File Streaming

- Files are served directly from LAN Host to guest browser
- The guest React app is compiled by Vite and served as static assets by the host
- No file data flows through the global portal
- Portal only manages access control and metadata

## Security Model

- Portal authentication via Better Auth
- Server ownership verified at DAL level
- Access tokens are short-lived and revocable
- LAN Host validates tokens on every request
- No secrets exposed to client components
- `server-only` protection on all sensitive modules
