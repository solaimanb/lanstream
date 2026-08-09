import type { MediaFile } from "@lanstream/protocol";

const DEFAULT_RETRY_COUNT = 15;
const DEFAULT_RETRY_DELAY_MS = 1_000;

interface LoadMediaFilesOptions {
  signal: AbortSignal;
  fetcher?: typeof fetch;
  retryCount?: number;
  retryDelayMs?: number;
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}

function abortableWait(
  milliseconds: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timeout = window.setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    const abort = () => {
      window.clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}

export async function loadMediaFiles(
  token: string,
  options: LoadMediaFilesOptions,
): Promise<MediaFile[]> {
  const fetcher = options.fetcher ?? fetch;
  const retryCount = options.retryCount ?? DEFAULT_RETRY_COUNT;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const wait = options.wait ?? abortableWait;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    const response = await fetcher(`/files/${encodeURIComponent(token)}`, {
      signal: options.signal,
    });
    if (response.ok) {
      const payload = (await response.json()) as { data?: MediaFile[] };
      return payload.data ?? [];
    }
    if (response.status !== 401) {
      throw new Error("Unable to load media.");
    }
    if (attempt < retryCount) {
      await wait(retryDelayMs, options.signal);
    }
  }

  throw new Error("This link is invalid or expired.");
}
