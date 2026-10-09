"use strict";
// POST /api/analyze  {act, district, area?, lang, photos:[{slot, type, data(base64)}]}
// → {act, district, lang, mock, score, summary, results:[{code, status, observation, fix, confidence, reason?}]}
const { wrap } = require("../lib/http");
const { analyze } = require("../lib/core");

module.exports = wrap(body => analyze(body), { method: "POST", limit: 10 });
