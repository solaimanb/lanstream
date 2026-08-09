import type { MediaFile } from "@lanstream/protocol";
import {
  ChevronRight,
  File,
  FileImage,
  Film,
  Folder,
  FolderOpen,
  House,
  Link2Off,
  Music,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { loadMediaFiles } from "./access-link-client";

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".mkv",
  ".avi",
  ".mov",
  ".m4v",
  ".flv",
  ".wmv",
]);
const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".flac",
  ".ogg",
  ".wav",
  ".aac",
  ".m4a",
  ".wma",
]);
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
]);

type BrowserRow =
  | { kind: "directory"; name: string; path: string; count: number }
  | { kind: "file"; name: string; file: MediaFile };

function getToken(): string | null {
  return new URLSearchParams(window.location.hash.slice(1)).get("token");
}

function createStreamUrl(token: string, path: string): string {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `/stream/${encodeURIComponent(token)}/${encodedPath}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
}

function FileTypeIcon({ name }: { name: string }) {
  const extension = name.slice(name.lastIndexOf(".")).toLowerCase();
  if (VIDEO_EXTENSIONS.has(extension)) return <Film aria-hidden="true" />;
  if (AUDIO_EXTENSIONS.has(extension)) return <Music aria-hidden="true" />;
  if (IMAGE_EXTENSIONS.has(extension)) {
    return <FileImage aria-hidden="true" />;
  }
  return <File aria-hidden="true" />;
}

function Breadcrumbs({
  path,
  onNavigate,
}: {
  path: string;
  onNavigate: (path: string) => void;
}) {
  const parts = path.split("/").filter(Boolean);

  return (
    <nav className="breadcrumbs" aria-label="Media folders">
      <button
        className={parts.length === 0 ? "breadcrumb current" : "breadcrumb"}
        type="button"
        onClick={() => onNavigate("")}
        disabled={parts.length === 0}
      >
        <House aria-hidden="true" />
        <span>Home</span>
      </button>
      {parts.map((part, index) => {
        const destination = parts.slice(0, index + 1).join("/");
        const isCurrent = index === parts.length - 1;
        return (
          <span className="breadcrumb-part" key={destination}>
            <ChevronRight className="breadcrumb-separator" aria-hidden="true" />
            <button
              className={isCurrent ? "breadcrumb current" : "breadcrumb"}
              type="button"
              onClick={() => onNavigate(destination)}
              disabled={isCurrent}
            >
              {part}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

function TextPreview({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Preview request failed");
        return response.text();
      })
      .then(setText)
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(true);
        }
      });
    return () => controller.abort();
  }, [url]);

  if (error) return <div className="preview-message">Preview unavailable.</div>;
  if (text === null)
    return <div className="preview-message">Loading preview…</div>;
  return <pre className="text-preview">{text}</pre>;
}

function MediaPlayer({
  file,
  token,
  onClose,
}: {
  file: MediaFile;
  token: string;
  onClose: () => void;
}) {
  const url = createStreamUrl(token, file.path);
  const name = file.path.split("/").pop() ?? file.path;
  const closeButton = (
    <button className="close-button" type="button" onClick={onClose}>
      <X aria-hidden="true" />
      <span className="sr-only">Close preview</span>
    </button>
  );

  let preview: React.ReactNode;
  if (file.mimeType.startsWith("video/")) {
    preview = <video src={url} controls autoPlay />;
  } else if (file.mimeType.startsWith("audio/")) {
    preview = <audio src={url} controls autoPlay />;
  } else if (file.mimeType.startsWith("image/")) {
    preview = <img src={url} alt={name} />;
  } else if (file.mimeType === "application/pdf") {
    preview = <iframe src={url} title={name} />;
  } else if (
    file.mimeType.startsWith("text/") ||
    file.mimeType === "application/json" ||
    file.mimeType === "application/javascript"
  ) {
    preview = <TextPreview url={url} />;
  } else {
    preview = (
      <div className="unsupported-preview">
        <File aria-hidden="true" />
        <p>This file type cannot be previewed in the browser.</p>
        <a href={url} download={name}>
          Download file
        </a>
      </div>
    );
  }

  return (
    <section className="player" aria-label={`Previewing ${name}`}>
      <div className="player-heading">
        <span title={name}>{name}</span>
        {closeButton}
      </div>
      <div className="player-content">{preview}</div>
    </section>
  );
}

function buildRows(files: MediaFile[], currentPath: string): BrowserRow[] {
  const prefix = currentPath ? `${currentPath}/` : "";
  const directories = new Map<string, string>();
  const directFiles: MediaFile[] = [];

  for (const file of files) {
    if (!file.path.startsWith(prefix)) continue;
    const remainder = file.path.slice(prefix.length);
    const separator = remainder.indexOf("/");
    if (separator === -1) {
      directFiles.push(file);
    } else {
      const name = remainder.slice(0, separator);
      directories.set(name, `${prefix}${name}`);
    }
  }

  const directoryRows: BrowserRow[] = [...directories]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, path]) => ({
      kind: "directory",
      name,
      path,
      count: files.filter((file) => file.path.startsWith(`${path}/`)).length,
    }));
  const fileRows: BrowserRow[] = directFiles
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((file) => ({
      kind: "file",
      name: file.path.split("/").pop() ?? file.path,
      file,
    }));

  return [...directoryRows, ...fileRows];
}

export function GuestApp() {
  const [token] = useState(getToken);
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    loadMediaFiles(token, { signal: controller.signal })
      .then(setFiles)
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(
            reason instanceof Error ? reason.message : "Unable to load media.",
          );
        }
      });
    return () => controller.abort();
  }, [token]);

  const rows = useMemo(
    () => buildRows(files ?? [], currentPath),
    [files, currentPath],
  );
  const currentFolderName = currentPath.split("/").pop() || "Media library";

  function navigate(path: string) {
    setCurrentPath(path);
    setSelectedFile(null);
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <div className="brand">
          <div className="brand-mark">
            <Film aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">Local media</p>
            <h1>LANStream</h1>
          </div>
        </div>
        <div className="security-label">
          <ShieldCheck aria-hidden="true" />
          <span>Private LAN share</span>
        </div>
      </header>

      {!token ? (
        <div className="state-card error" role="alert">
          <span className="state-icon">
            <Link2Off aria-hidden="true" />
          </span>
          <div>
            <h2>Incomplete share link</h2>
            <p>Ask the owner to send the complete guest link again.</p>
          </div>
        </div>
      ) : error ? (
        <div className="state-card error" role="alert">
          <span className="state-icon">
            <Link2Off aria-hidden="true" />
          </span>
          <div>
            <h2>Unable to open this share</h2>
            <p>{error}</p>
          </div>
        </div>
      ) : files === null ? (
        <div className="state-card">
          <span className="spinner" aria-hidden="true" />
          <div>
            <h2>Opening media library</h2>
            <p>Authorizing the secure link…</p>
          </div>
        </div>
      ) : files.length === 0 ? (
        <div className="state-card">
          <span className="state-icon">
            <FolderOpen aria-hidden="true" />
          </span>
          <div>
            <h2>This library is empty</h2>
            <p>No media files were found in the shared directory.</p>
          </div>
        </div>
      ) : (
        <>
          {selectedFile && (
            <MediaPlayer
              file={selectedFile}
              token={token}
              onClose={() => setSelectedFile(null)}
            />
          )}
          <section className="library" aria-label="Media files">
            <div className="library-heading">
              <div>
                <p className="section-label">Shared library</p>
                <h2 title={currentFolderName}>{currentFolderName}</h2>
              </div>
              <span className="item-count">
                {rows.length} {rows.length === 1 ? "item" : "items"}
              </span>
            </div>
            <Breadcrumbs path={currentPath} onNavigate={navigate} />
            <div className="file-list">
              {rows.length === 0 ? (
                <div className="empty-folder">
                  <FolderOpen aria-hidden="true" />
                  <span>This folder is empty.</span>
                </div>
              ) : (
                rows.map((row) => {
                  if (row.kind === "directory") {
                    return (
                      <button
                        className="file-row"
                        type="button"
                        key={row.path}
                        onClick={() => navigate(row.path)}
                      >
                        <span className="file-icon folder-icon">
                          <Folder aria-hidden="true" />
                        </span>
                        <span className="file-name">{row.name}</span>
                        <span className="file-meta">
                          {row.count} {row.count === 1 ? "item" : "items"}
                        </span>
                      </button>
                    );
                  }
                  return (
                    <button
                      className={`file-row${selectedFile?.path === row.file.path ? " active" : ""}`}
                      type="button"
                      key={row.file.path}
                      onClick={() => setSelectedFile(row.file)}
                    >
                      <span className="file-icon">
                        <FileTypeIcon name={row.name} />
                      </span>
                      <span className="file-name">{row.name}</span>
                      <span className="file-meta">
                        {formatSize(row.file.size)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
