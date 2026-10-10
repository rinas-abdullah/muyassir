"use strict";
// POST /api/i18n  {lang}  → {lang, strings:{arabic: translation, …}}
// Translates the interface itself into the language the user picked, then caches it.
const { wrap } = require("../lib/http");
const { translateUI } = require("../lib/core");

module.exports = wrap(async body => {
  const lang = String((body && body.lang) || "");
  return { lang, strings: await translateUI(lang) };
}, { method: "POST", limit: 20 });
