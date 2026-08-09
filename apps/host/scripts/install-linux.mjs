#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform !== "linux") {
  throw new Error("This installer supports Linux only");
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const hostDirectory = resolve(scriptDirectory, "..");
const sourceDist = join(hostDirectory, "dist");
if (!existsSync(join(sourceDist, "main.js"))) {
  throw new Error(
    "Host build not found. Run the host build before installing.",
  );
}

const dataHome =
  process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
const configHome = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
const installDirectory = join(dataHome, "lanstream-host");
const applicationDirectory = join(dataHome, "applications");
const serviceDirectory = join(configHome, "systemd", "user");
const installedDist = join(installDirectory, "dist");
const installedLauncher = join(installDirectory, "launch-linux.mjs");
const desktopPath = join(applicationDirectory, "lanstream-host.desktop");
const servicePath = join(serviceDirectory, "lanstream-host.service");

mkdirSync(installDirectory, { recursive: true, mode: 0o755 });
mkdirSync(applicationDirectory, { recursive: true, mode: 0o755 });
mkdirSync(serviceDirectory, { recursive: true, mode: 0o755 });
cpSync(sourceDist, installedDist, { recursive: true, force: true });
cpSync(join(scriptDirectory, "launch-linux.mjs"), installedLauncher, {
  force: true,
});
chmodSync(installedLauncher, 0o755);

writeFileSync(
  desktopPath,
  `[Desktop Entry]\nType=Application\nName=LANStream Host\nComment=Connect this computer to LANStream\nExec=${process.execPath} ${installedLauncher} %u\nTerminal=false\nNoDisplay=true\nMimeType=x-scheme-handler/lanstream;\nCategories=Network;AudioVideo;\n`,
  { encoding: "utf8", mode: 0o644 },
);

writeFileSync(
  servicePath,
  `[Unit]\nDescription=LANStream Host Agent\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=simple\nExecStart=${process.execPath} ${join(installedDist, "main.js")}\nRestart=on-failure\nRestartSec=10\n\n[Install]\nWantedBy=default.target\n`,
  { encoding: "utf8", mode: 0o644 },
);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${command} failed with status ${result.status ?? 1}`);
  }
}

run("update-desktop-database", [applicationDirectory]);
run("xdg-mime", [
  "default",
  "lanstream-host.desktop",
  "x-scheme-handler/lanstream",
]);
run("systemctl", ["--user", "daemon-reload"]);
run("systemctl", ["--user", "enable", "lanstream-host.service"]);
run("systemctl", ["--user", "try-restart", "lanstream-host.service"]);

console.log(`Installed LANStream Host in ${installDirectory}`);
console.log("The browser Launch button can now start the host service.");
