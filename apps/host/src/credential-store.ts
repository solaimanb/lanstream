import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

interface StoredCredential {
  portalUrl: string;
  agentToken: string;
}

function credentialPath(): string {
  if (process.env.LANSTREAM_CONFIG_PATH)
    return process.env.LANSTREAM_CONFIG_PATH;
  if (process.platform === "win32") {
    return join(process.env.APPDATA ?? homedir(), "LANStream", "agent.json");
  }
  if (process.platform === "darwin") {
    return join(
      homedir(),
      "Library",
      "Application Support",
      "LANStream",
      "agent.json",
    );
  }
  return join(
    process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"),
    "lanstream",
    "agent.json",
  );
}

export function loadStoredAgentToken(portalUrl: string): string | null {
  const path = credentialPath();
  if (!existsSync(path)) return null;
  try {
    const value = JSON.parse(readFileSync(path, "utf8")) as StoredCredential;
    return value.portalUrl.replace(/\/$/, "") ===
      portalUrl.replace(/\/$/, "") && value.agentToken.startsWith("lansta_")
      ? value.agentToken
      : null;
  } catch {
    return null;
  }
}

export function saveAgentToken(portalUrl: string, agentToken: string): void {
  const path = credentialPath();
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temporaryPath = `${path}.tmp`;
  writeFileSync(
    temporaryPath,
    JSON.stringify(
      { portalUrl: portalUrl.replace(/\/$/, ""), agentToken },
      null,
      2,
    ),
    { encoding: "utf8", mode: 0o600 },
  );
  renameSync(temporaryPath, path);
  chmodSync(path, 0o600);
}
