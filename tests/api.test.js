"use strict";
// End-to-end API test in mock mode (no API key, no network). Run: npm test
process.env.MOCK = "1";
delete process.env.ADMIN_PIN;
const test = require("node:test");
const assert = require("node:assert/strict");
const server = require("../server");

const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
let base;

test.before(() => new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); })));
test.after(() => new Promise(r => server.close(r)));

const post = (p, body) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("health reports mock mode", async () => {
  const h = await (await fetch(base + "/api/health")).json();
  assert.equal(h.ok, true);
  assert.equal(h.mock, true);
});

test("analyze returns a full report and stores an anonymised record", async () => {
  const res = await post("/api/analyze", { act: "cafe", district: "العزيزية", lang: "ar", photos: [{ slot: "facade", type: "image/png", data: PNG }, { slot: "entrance", type: "image/png", data: PNG }] });
  assert.equal(res.status, 200);
  const r = await res.json();
  assert.equal(r.mock, true);
  assert.equal(r.results.length, 10);
  assert.ok(r.score > 0 && r.score < 100);
  assert.equal(r.results.find(x => x.code === "SIGN-FIT").status, "fail");
  assert.equal(r.results.find(x => x.code === "DOC-READ").reason, "no_photo");
  const s = await (await fetch(base + "/api/stats")).json();
  assert.equal(s.checks.length, 1);
  assert.deepEqual(Object.keys(s.checks[0]).sort(), ["act", "at", "district", "fail", "lang", "mock", "pass", "review", "score", "total"].sort(), "no photos or personal data are stored");
});

test("analyze rejects a request without the facade", async () => {
  const res = await post("/api/analyze", { act: "cafe", photos: [{ slot: "interior", type: "image/png", data: PNG }] });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "no_facade");
});

test("ask answers and logs the question language only", async () => {
  const res = await post("/api/ask", { lang: "ar", messages: [{ role: "user", content: "মুদি দোকান খুলতে কী লাগবে?" }] });
  assert.equal(res.status, 200);
  assert.ok((await res.json()).text.length > 0);
  const s = await (await fetch(base + "/api/stats")).json();
  assert.deepEqual(s.questions[0].lang, "bn");
  assert.equal(Object.keys(s.questions[0]).includes("content"), false);
});

test("wrong methods are refused", async () => {
  assert.equal((await fetch(base + "/api/analyze")).status, 405);
});

test("the site serves the app and blocks path traversal", async () => {
  const html = await (await fetch(base + "/")).text();
  assert.match(html, /مُيسّر/);
  assert.match(html, /kb\.js/);
  assert.notEqual((await fetch(base + "/../server.js")).status, 200);
});

test("the interface language service returns English without calling the model", async () => {
  const res = await post("/api/i18n", { lang: "en" });
  assert.equal(res.status, 200);
  const { lang, strings } = await res.json();
  assert.equal(lang, "en");
  const { I18N } = require("../lib/core");
  assert.equal(Object.keys(strings).length, I18N.KEYS.length);
  assert.equal(strings[I18N.KEYS[0]], I18N.dict.en[I18N.KEYS[0]]);
});

test("the interface language service refuses an unknown language", async () => {
  const res = await post("/api/i18n", { lang: "zz" });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "bad_lang");
});

test("without an API key the interface cannot be translated into a new language", async () => {
  const { KB, I18N } = require("../lib/core");
  const lang = Object.keys(KB.LANGS).find(l => l !== "ar" && !I18N.dict[l]);
  const res = await post("/api/i18n", { lang });        // tests run in mock mode
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, "no_key");
});

test("every language that ships with the app covers every string", () => {
  const { I18N } = require("../lib/core");
  assert.ok(I18N.dict.en, "English always ships");
  for (const lang of Object.keys(I18N.dict)) {
    const missing = I18N.KEYS.filter(k => !I18N.dict[lang][k]);
    assert.deepEqual(missing, [], lang + " is incomplete — run: node tools/extract-i18n.js");
  }
});
