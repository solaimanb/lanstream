/**
 * useHostStatus — polls the LAN Host's /status endpoint.
 *
 * Used by guest browsers to display real-time host status.
 * Returns HostStatusResponse from the protocol package.
 */
"use client";

import type { HostStatusResponse } from "@lanstream/protocol";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseHostStatusOptions {
  /** Polling interval in ms. Defaults to 10000. */
  intervalMs?: number;
  /** Base URL of the host. Defaults to window.location.origin. */
  baseUrl?: string;
  /** Access token for authenticated guest access. */
  token?: string;
}

interface UseHostStatusResult {
  data: HostStatusResponse | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useHostStatus(
  options: UseHostStatusOptions = {},
): UseHostStatusResult {
  const { intervalMs = 10_000, baseUrl, token } = options;

  const [data, setData] = useState<HostStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = `${baseUrl ?? ""}/status`;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (mountedRef.current) {
        setData(json);
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
  }, [baseUrl, token]);

  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(fetchStatus, intervalMs);

    // Trigger the first fetch via a microtask to avoid synchronous setState
    queueMicrotask(fetchStatus);

    return () => {
      mountedRef.current = false;
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [intervalMs, fetchStatus]);

  return { data, error, loading, refresh: fetchStatus };
}
