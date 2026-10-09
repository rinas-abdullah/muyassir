"use strict";
// POST /api/ask  {lang, messages:[{role:"user"|"assistant", content}]}  → {text, mock}
const { wrap } = require("../lib/http");
const { ask } = require("../lib/core");

module.exports = wrap(body => ask(body), { method: "POST", limit: 30 });
