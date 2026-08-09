/**
 * useServerStatus — polls the server status endpoint.
 *
 * Returns the current ServerStatus + host device info.
 * Automatically re-polls on an interval when the server is online.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HostDevice {
  hostname: string;
  platform: string;
  version: string;
  localIp: string;
  port: number;
  lastSeenAt: string | null;
}

interface ServerStatusResponse {
  server: {
    id: string;
    name: string;
    status: string;
    updatedAt: string;
  };
  hostDevice: HostDevice | null;
}

interface UseServerStatusOptions {
  /** Polling interval in ms. Defaults to 30000. */
  intervalMs?: number;
  /** Whether polling is enabled. Defaults to true. */
  enabled?: boolean;
}

interface UseServerStatusResult {
  data: ServerStatusResponse | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useServerStatus(
  serverId: string,
  options: UseServerStatusOptions = {},
): UseServerStatusResult {
  const { intervalMs = 30_000, enabled = true } = options;

  const [data, setData] = useState<ServerStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/servers/${serverId}/status`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { data: ServerStatusResponse };
      if (mountedRef.current) {
        setData(json.data);
        setError(null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch status");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [serverId]);

  // Polling — use setInterval which is fine for subscription patterns
  useEffect(() => {
    if (!enabled) return;

    mountedRef.current = true;
    const id = setInterval(fetchStatus, intervalMs);

    // Trigger the first fetch via a microtask to avoid synchronous setState
    queueMicrotask(fetchStatus);

    return () => {
      mountedRef.current = false;
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [enabled, intervalMs, fetchStatus]);

  return { data, error, loading, refresh: fetchStatus };
}
