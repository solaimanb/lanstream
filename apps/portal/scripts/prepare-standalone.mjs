import { cpSync, mkdirSync } from "node:fs";

const appRoot = ".next/standalone/apps/portal";
mkdirSync(`${appRoot}/.next`, { recursive: true });
cpSync(".next/static", `${appRoot}/.next/static`, { recursive: true });
cpSync("public", `${appRoot}/public`, { recursive: true });
