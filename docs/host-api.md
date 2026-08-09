# LANStream Host API

## Overview

The LAN Host exposes a local HTTP server for guest file streaming.

## Port

Default: `4780` (configurable)

## Endpoints

### Agent Control Plane

```
POST /api/agent/heartbeat
Authorization: Bearer <paired-agent-token>
```

The physical host reports its running logical servers and receives the complete
desired assignment set. The operation is idempotent: missed heartbeats do not
lose start requests, and reconnecting agents reconcile automatically.

### Automatic Agent Pairing

An unconfigured host starts device authorization with:

```http
POST /api/agent/pair/start
Content-Type: application/json
```

The response contains a short-lived user code, an owner approval URL, and a
private pairing secret. The host opens the URL and polls with that secret:

```http
POST /api/agent/pair/poll
Authorization: Bearer <pairing-secret>
```

After the signed-in owner approves the code, one successful poll returns the
durable agent token. Pairing requests expire after ten minutes and cannot be
consumed twice.

### Guest Player

```
GET /watch#token=:token
```

Serves the compiled React guest application. Its JavaScript and CSS bundles are
served from `/guest-assets/*`; media requests remain same-origin with the host.

### File Streaming

```
GET /stream/:token/:path
```

Serves files to authenticated guests via temporary access tokens.

### Status

```
GET /status
```

Returns current host status and capabilities.

## Security

- Access tokens validated on every request
- Tokens are short-lived and revocable
- Only serves files from configured media directories
- No directory traversal allowed

## Network

- Runs on local network only
- Not exposed to the internet
- Guest browsers connect directly to LAN Host
