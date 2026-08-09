/**
 * Application constants.
 */

/** Default port for the LAN Host HTTP server */
export const HOST_DEFAULT_PORT = 4780

/** Heartbeat interval in milliseconds */
export const HEARTBEAT_INTERVAL_MS = 30_000

/** Server considered offline after this many missed heartbeats */
export const OFFLINE_THRESHOLD_MS = 90_000

/** Maximum length for server display name */
export const MAX_SERVER_NAME_LENGTH = 64

/** Maximum length for access link description */
export const MAX_ACCESS_LINK_DESCRIPTION_LENGTH = 256
