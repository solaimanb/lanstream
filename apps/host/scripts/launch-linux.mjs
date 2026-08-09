#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function portalFromLaunchUrl(raw) {
  try {
    const launchUrl = new URL(raw);
    if (launchUrl.protocol !== "lanstream:" || launchUrl.hostname !== "pair") {
      return null;
    }
    const portal = new URL(launchUrl.searchParams.get("portal") ?? "");
    return portal.protocol === "http:" || portal.protocol === "https:"
      ? portal.toString().replace(/\/$/, "")
      : null;
  } catch {
    return null;
  }
}

const portalUrl = portalFromLaunchUrl(process.argv[2]);
if (portalUrl) {
  const configured = spawnSync(
    "systemctl",
    ["--user", "set-environment", `LANSTREAM_PORTAL_URL=${portalUrl}`],
    { stdio: "ignore" },
  );
  if (configured.status !== 0) process.exit(configured.status ?? 1);
}

const restarted = spawnSync(
  "systemctl",
  ["--user", "restart", "lanstream-host.service"],
  { stdio: "ignore" },
);
process.exit(restarted.status ?? 1);
