"use strict";
// GET /api/stats  → {checks:[…], questions:[…], storage}
// Protected by ADMIN_PIN when it is set: send it in the "x-admin-pin" header.
const { wrap } = require("../lib/http");
const { stats, HttpError } = require("../lib/core");

module.exports = wrap(async (_body, req) => {
  const pin = process.env.ADMIN_PIN;
  if (pin && req.headers["x-admin-pin"] !== pin) throw new HttpError(401, "pin_required", "Enter the municipality PIN.");
  return stats();
}, { method: "GET", limit: 60 });
