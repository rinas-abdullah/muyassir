"use strict";
// GET /api/health → {ok, mock, model, storage, pin}
const { wrap } = require("../lib/http");
const { isMock, MODEL, store } = require("../lib/core");

module.exports = wrap(async () => ({
  ok: true, mock: isMock(), model: isMock() ? null : MODEL, storage: store.backend(), pin: !!process.env.ADMIN_PIN
}), { method: "GET", limit: 120 });
