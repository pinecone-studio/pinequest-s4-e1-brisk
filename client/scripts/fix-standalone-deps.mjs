import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const monorepoRoot = path.dirname(clientRoot);
// OpenNext detects the monorepo root via the lock file at the repo root, so it
// reads the app build output from standalone/<packagePath>/{.next,server.js}
// (with node_modules at the standalone root). packagePath is "client" here.
const packagePath = path.relative(monorepoRoot, clientRoot);

const standaloneRoot = path.join(clientRoot, ".next/standalone");
const standaloneNodeModules = path.join(standaloneRoot, "node_modules");
const standaloneNext = path.join(standaloneNodeModules, "next");
const sourceNext = path.join(clientRoot, "node_modules/next");

if (!existsSync(sourceNext)) {
  throw new Error(`Missing Next.js package at ${sourceNext}`);
}

if (!existsSync(standaloneRoot)) {
  throw new Error(`Missing standalone output at ${standaloneRoot}`);
}

// Next 16 with outputFileTracingRoot=clientRoot emits a FLAT standalone (.next
// and server.js at the standalone root). OpenNext's monorepo code paths read
// them from standalone/<packagePath>, so move them under that prefix.
const nestedRoot = path.join(standaloneRoot, packagePath);
const flatNext = path.join(standaloneRoot, ".next");
const nestedNext = path.join(nestedRoot, ".next");
if (existsSync(flatNext) && !existsSync(nestedNext)) {
  mkdirSync(nestedRoot, { recursive: true });
  renameSync(flatNext, nestedNext);
}

const flatServer = path.join(standaloneRoot, "server.js");
const nestedServer = path.join(nestedRoot, "server.js");
if (existsSync(flatServer) && !existsSync(nestedServer)) {
  mkdirSync(nestedRoot, { recursive: true });
  renameSync(flatServer, nestedServer);
}

mkdirSync(standaloneNodeModules, { recursive: true });
rmSync(standaloneNext, { recursive: true, force: true });
// dereference: copy real files instead of recreating symlinks, which Windows
// blocks without elevated/Developer-Mode privileges (Bun symlinks into .bun store).
cpSync(sourceNext, standaloneNext, { recursive: true, dereference: true });

console.log("Prepared standalone output for OpenNext.");
