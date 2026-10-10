"use strict";
// Unit tests for the readiness-check logic. Run: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../lib/core");

const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const cafeCodes = core.KB.ACTS.cafe.items.map(i => i.code);

test("validateCheck rejects a request without the facade photo", () => {
  assert.throws(() => core.validateCheck({ act: "cafe", photos: [{ slot: "entrance", type: "image/png", data: PNG }] }), e => e.code === "no_facade");
});

test("validateCheck rejects unknown activities, bad types and repeated slots", () => {
  assert.throws(() => core.validateCheck({ act: "casino", photos: [{ slot: "facade", type: "image/png", data: PNG }] }), e => e.code === "bad_activity");
  assert.throws(() => core.validateCheck({ act: "cafe", photos: [{ slot: "facade", type: "image/gif", data: PNG }] }), e => e.code === "bad_type");
  assert.throws(() => core.validateCheck({ act: "cafe", photos: [{ slot: "facade", type: "image/png", data: PNG }, { slot: "facade", type: "image/png", data: PNG }] }), e => e.code === "bad_slot");
});

test("validateCheck keeps photos in slot order and falls back to Arabic", () => {
  const v = core.validateCheck({ act: "cafe", lang: "xx", photos: [{ slot: "interior", type: "image/png", data: PNG }, { slot: "facade", type: "image/png", data: PNG }] });
  assert.deepEqual(v.photos.map(p => p.slot), ["facade", "interior"]);
  assert.equal(v.lang, "ar");
});

test("the prompt lists only the items for uploaded photos, in the chosen language", () => {
  const p = core.buildCheckPrompt({ act: "cafe", lang: "ur", district: "العزيزية", area: 60, slots: ["facade"] });
  assert.match(p, /SIGN-FIT/);
  assert.doesNotMatch(p, /ENT-ACCESS/);
  assert.match(p, /Urdu/);
  assert.match(p, /60 m²/);
});

test("parseJsonReply reads plain JSON, fenced JSON and JSON with a sentence around it", () => {
  assert.deepEqual(core.parseJsonReply('{"a":1}'), { a: 1 });
  assert.deepEqual(core.parseJsonReply('```json\n{"a":2}\n```'), { a: 2 });
  assert.deepEqual(core.parseJsonReply('Here it is: {"a":3} done'), { a: 3 });
  assert.equal(core.parseJsonReply("no json here"), null);
});

test("postProcess never guesses: low confidence, missing answers and missing photos become needs_review", () => {
  const out = { summary: "x", results: [
    { code: "SIGN-FIT", status: "fail", observation: "o", fix: "f", confidence: 0.9 },
    { code: "SIGN-AR", status: "pass", observation: "o", fix: "should be dropped", confidence: 0.95 },
    { code: "FAC-CLEAN", status: "pass", observation: "o", fix: "", confidence: 0.4 },
    { code: "FAC-GLASS", status: "maybe", observation: "o", fix: "", confidence: 0.9 },
    { code: "MADE-UP", status: "fail", observation: "invented requirement", fix: "", confidence: 1 }
  ] };
  const r = core.postProcess({ act: "cafe", lang: "ar", slots: ["facade"] }, out);
  const by = Object.fromEntries(r.results.map(x => [x.code, x]));
  assert.deepEqual(r.results.map(x => x.code), cafeCodes, "only checklist items, in order");
  assert.equal(by["SIGN-FIT"].status, "fail");
  assert.equal(by["SIGN-AR"].fix, "", "no fix on a pass");
  assert.equal(by["FAC-CLEAN"].status, "needs_review");
  assert.equal(by["FAC-CLEAN"].reason, "low_confidence");
  assert.equal(by["FAC-GLASS"].status, "needs_review");
  assert.equal(by["ENT-ACCESS"].reason, "no_photo");
  assert.ok(!by["MADE-UP"], "invented codes are ignored");
});

test("scoreOf weights high items 3, medium 2, low 1 and counts needs_review as half", () => {
  const all = st => core.KB.ACTS.cafe.items.map(i => ({ code: i.code, status: st }));
  assert.equal(core.scoreOf("cafe", all("pass")), 100);
  assert.equal(core.scoreOf("cafe", all("fail")), 0);
  assert.equal(core.scoreOf("cafe", all("needs_review")), 50);
});

test("detectLang tells the five languages apart", () => {
  assert.equal(core.detectLang("وش أحتاج عشان أفتح بقالة؟"), "ar");
  assert.equal(core.detectLang("مجھے نائی کی دکان کھولنی ہے"), "ur");
  assert.equal(core.detectLang("মুদি দোকান খুলতে কী লাগবে?"), "bn");
  assert.equal(core.detectLang("Apa syarat untuk membuka restoran?"), "id");
  assert.equal(core.detectLang("What do I need for a café?"), "en");
});

test("offline assistant answers from the knowledge base without an API key", () => {
  assert.match(core.offlineAnswer("وش أحتاج عشان أفتح بقالة؟"), /اشتراطات بقالة/);
  assert.match(core.offlineAnswer("وش اشتراطات اللوحة؟"), /اللوحة التجارية/);
  assert.match(core.offlineAnswer("كم رسوم الرخصة؟"), /940/);
  assert.match(core.offlineAnswer("What should my café signboard look like?"), /signboard/);
});

test("the interface strings are keyed by Arabic and translated, never left as the key", () => {
  const { I18N } = require("../lib/core");
  assert.ok(I18N.KEYS.length > 300);
  assert.ok(I18N.KEYS.every(k => /[؀-ۿ]/.test(k)), "every key is the Arabic original");
  assert.ok(I18N.KEYS.every(k => k === k.replace(/\s+/g, " ").trim()), "keys are whitespace-normalised");
  for (const lang of Object.keys(I18N.dict)) {
    const d = I18N.dict[lang];
    assert.deepEqual(I18N.KEYS.filter(k => !d[k]), [], lang + " is missing strings — run: node tools/extract-i18n.js");
    /* Urdu shares the Arabic script, so a few words land identical on purpose;
       a whole dictionary left as the Arabic source would not. */
    const same = I18N.KEYS.filter(k => d[k] === k);
    assert.ok(same.length <= I18N.KEYS.length * 0.01, lang + " leaves " + same.length + " strings in Arabic: " + same.slice(0, 10).join(" | "));
  }
});

test("a sentence with values keeps the same placeholders in every language", () => {
  const { I18N } = require("../lib/core");
  const holes = s => (String(s).match(/\{\w+\}/g) || []).sort().join(",");
  for (const lang of Object.keys(I18N.dict)) {
    const bad = I18N.KEYS.filter(k => holes(k) !== holes(I18N.dict[lang][k]));
    assert.deepEqual(bad, [], lang + " changed the values inside a sentence");
  }
});

/* a language the app does not already ship, so the translation path really runs */
function unshippedLang(skip) {
  return Object.keys(core.KB.LANGS).find(l => l !== "ar" && !core.I18N.dict[l] && l !== skip);
}

test("the interface is translated in chunks, merged, and then served from cache", async () => {
  const lang = unshippedLang();
  const realFetch = globalThis.fetch, realKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test-key";
  let calls = 0;
  globalThis.fetch = async (url, opts) => {
    calls++;
    const prompt = JSON.parse(opts.body).messages[0].content;
    const asked = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1));
    const out = {};
    for (const k of Object.keys(asked)) out[k] = "BN:" + k;      // a stand-in translation
    return { ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: JSON.stringify(out) }] }) };
  };
  try {
    const strings = await core.translateUI(lang);
    assert.ok(calls > 1, "long string tables are split across several calls");
    assert.deepEqual(core.I18N.KEYS.filter(k => !strings[k]), [], "every string comes back translated");
    const before = calls;
    assert.deepEqual(await core.translateUI(lang), strings);
    assert.equal(calls, before, "the second request is served from cache");
  } finally {
    globalThis.fetch = realFetch;
    if (realKey === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = realKey;
  }
});

test("a half-finished translation is refused rather than shown", async () => {
  const lang = unshippedLang(unshippedLang());
  const realFetch = globalThis.fetch, realKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test-key";
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: "{}" }] }) });
  try {
    await assert.rejects(core.translateUI(lang), e => e.code === "i18n_failed");
  } finally {
    globalThis.fetch = realFetch;
    if (realKey === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = realKey;
  }
});
