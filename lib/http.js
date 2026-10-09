"use strict";
/* Shared request handling for the API routes (works on Vercel and in server.js). */
const { HttpError, rateLimit } = require("./core");

const MAX_BODY = 14 * 1024 * 1024;

function readBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string") { try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.reject(new HttpError(400, "bad_json", "Body must be JSON.")); } }
    return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", c => { size += c.length; if (size > MAX_BODY) { reject(new HttpError(413, "too_large", "Request too large.")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); } catch (e) { reject(new HttpError(400, "bad_json", "Body must be JSON.")); } });
    req.on("error", reject);
  });
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(obj));
}

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  return (xf ? String(xf).split(",")[0] : req.socket && req.socket.remoteAddress) || "unknown";
}

/* wrap(handler, {method, limit}) → (req,res) */
function wrap(handler, { method = "POST", limit = 20 } = {}) {
  return async (req, res) => {
    try {
      if (req.method !== method) throw new HttpError(405, "method_not_allowed", `Use ${method}.`);
      if (limit) rateLimit(clientIp(req), limit);
      const body = method === "POST" ? await readBody(req) : null;
      const out = await handler(body, req);
      send(res, 200, out);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      send(res, status, { error: e instanceof HttpError ? e.code : "server_error", message: e instanceof HttpError ? e.message : "Unexpected error." });
    }
  };
}

module.exports = { wrap, send, readBody };
