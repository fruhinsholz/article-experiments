#!/usr/bin/env node
import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? 4177);
const USERNAME = process.env.VIEWER_USER ?? "viewer";
const PASSWORD = process.env.VIEWER_PASSWORD ?? "";
const TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
]);

function resolveRequest(url) {
  const parsed = new URL(url, `http://${HOST}:${PORT}`);
  const decodedPath = decodeURIComponent(parsed.pathname);
  const relative = decodedPath === "/" ? "viewer/index.html" : decodedPath.replace(/^\/+/, "");
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(ROOT + path.sep) && absolute !== ROOT) return null;
  return absolute;
}

function isAuthorized(request) {
  if (!PASSWORD) return true;

  const header = request.headers.authorization ?? "";
  if (!header.startsWith("Basic ")) return false;

  const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
  return decoded === `${USERNAME}:${PASSWORD}`;
}

const server = createServer(async (request, response) => {
  if (!isAuthorized(request)) {
    response.writeHead(401, {
      "content-type": "text/plain; charset=utf-8",
      "www-authenticate": 'Basic realm="Prompt Contract Image Viewer"',
    });
    response.end("Authentication required\n");
    return;
  }

  const file = resolveRequest(request.url ?? "/");
  if (!file || !existsSync(file)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
    return;
  }

  const fileStat = await stat(file);
  if (!fileStat.isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
    return;
  }

  response.writeHead(200, {
    "content-type": TYPES.get(path.extname(file).toLowerCase()) ?? "application/octet-stream",
    "content-length": fileStat.size,
    "cache-control": "no-cache",
  });
  createReadStream(file).pipe(response);
});

server.listen(PORT, HOST, () => {
  const scriptPath = path.relative(ROOT, fileURLToPath(import.meta.url));
  const displayHost = HOST === "0.0.0.0" ? "127.0.0.1" : HOST;
  const authNote = PASSWORD ? ` with basic auth user "${USERNAME}"` : "";
  console.log(`Serving ${scriptPath} at http://${displayHost}:${PORT}/${authNote}`);
});
