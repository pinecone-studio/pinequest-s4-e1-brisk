import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// OpenNext nests the build output under the monorepo packagePath ("client").
const packagePath = path.relative(path.dirname(clientRoot), clientRoot);
const serverFnDir = path.join(
  clientRoot,
  ".open-next/server-functions/default",
);
// The Next server class (with getMiddlewareManifest) lives in the nested
// packagePath handler; older flat builds kept it at the root. Pick whichever
// exists.
const handlerPath = [
  path.join(serverFnDir, packagePath, "handler.mjs"),
  path.join(serverFnDir, "handler.mjs"),
].find(existsSync);
if (!handlerPath) {
  throw new Error("Could not find OpenNext server handler.mjs");
}
const manifestPath = path.join(
  serverFnDir,
  packagePath,
  ".next/server/middleware-manifest.json",
);

const manifest = readFileSync(manifestPath, "utf8");
let handler = readFileSync(handlerPath, "utf8");

// Next emits one of two forms depending on version:
//   getMiddlewareManifest(){return null}                                  (current)
//   getMiddlewareManifest(){return this.minimalMode?...:require(...)}     (older)
// Either way, inline the real manifest so middleware (Clerk auth) resolves
// in the bundled Cloudflare worker.
const pattern =
  /getMiddlewareManifest\(\)\{return (?:null|this\.minimalMode\?[^:]+:require\(this\.middlewareManifestPath\))\}/;

if (!pattern.test(handler)) {
  throw new Error("Could not find getMiddlewareManifest() patch target in handler.mjs");
}

handler = handler.replace(
  pattern,
  `getMiddlewareManifest(){return ${manifest}}`,
);

writeFileSync(handlerPath, handler);
console.log("Patched middleware manifest into OpenNext handler.");
