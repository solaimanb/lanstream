# LANStream Cloud API

## Base URL

```
/api
```

## Authentication

All portal API routes require authentication via Better Auth session.

## Endpoints

### Health Check

```
GET /api/health
```

Returns application health status.

### Auth

```
GET/POST /api/auth/[...all]
```

Better Auth catch-all handler for sign-in, sign-up, session management.

### Runtime

#### Claim

```
POST /api/runtime/claim
```

LAN Host claims server registration.

#### Heartbeat

```
POST /api/runtime/heartbeat
```

LAN Host sends periodic heartbeat updates.

- **Must not be cached**
- Returns pending commands and access token revocations

#### Release

```
POST /api/runtime/release
```

LAN Host notifies when going offline.

### Server Status

```
GET /api/servers/[serverId]/status
```

Returns current host status for a specific server.

- **Must not be cached**
- Returns live runtime state

## Response Format

All responses use JSON format:

```json
{
  "data": { ... },
  "error": null
}
```

Or on error:

```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Server not found"
  }
}
```
