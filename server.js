"use strict";
/*
 * Local server: serves public/ and the same /api routes Vercel runs.
 *   node server.js            → http://localhost:3000
 *   MOCK=1 node server.js     → offline demo, no API key needed
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

// load .env if present (no dependency needed)
try {
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch (e) { /* no .env */ }

const routes = {
  "/api/analyze": require("./api/analyze"),
  "/api/ask": require("./api/ask"),
  "/api/stats": require("./api/stats"),
  "/api/health": require("./api/health"),
  "/api/i18n": require("./api/i18n")
};
const PUBLIC = path.join(__dirname, "public");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".json": "application/json" };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (routes[url.pathname]) return routes[url.pathname](req, res);
  let file = path.normalize(path.join(PUBLIC, url.pathname === "/" ? "index.html" : url.pathname));
  if (!file.startsWith(PUBLIC)) { res.statusCode = 403; return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("content-type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(buf);
  });
});

const port = Number(process.env.PORT) || 3000;
if (require.main === module) {
  server.listen(port, () => {
    const { isMock, MODEL } = require("./lib/core");
    console.log(`Muyassir running at http://localhost:${port}  (${isMock() ? "MOCK mode — no API key" : "model " + MODEL})`);
  });
}
module.exports = server;
