"use strict";
/*
 * Accuracy test for the readiness check.
 *
 * 1. Put real shop photos in eval/photos/
 * 2. Label them in eval/cases.json (copy cases.example.json): for each case, the activity, its photos,
 *    and the CORRECT status of each item as a person (the requirements expert) judged it.
 * 3. Run:  ANTHROPIC_API_KEY=... npm run eval
 *
 * Writes eval/results/report.md and eval/results/details.json:
 *  - accuracy on items the model decided (pass/fail) — the number to present on stage
 *  - how often it said "needs_review" instead of guessing
 *  - dangerous misses: items the expert marked "fail" that the model marked "pass"
 */
const fs = require("fs");
const path = require("path");
const core = require("../lib/core");

const DIR = __dirname;
const casesFile = process.argv[2] ? path.resolve(process.argv[2]) : path.join(DIR, "cases.json");
const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

async function main() {
  if (core.isMock()) {
    console.error("Set ANTHROPIC_API_KEY (and leave MOCK unset) to run the evaluation against the real model.");
    process.exit(1);
  }
  if (!fs.existsSync(casesFile)) {
    console.error(`No ${path.relative(process.cwd(), casesFile)} found. Copy eval/cases.example.json to eval/cases.json and label your photos.`);
    process.exit(1);
  }
  const cases = JSON.parse(fs.readFileSync(casesFile, "utf8"));
  const rows = [];
  const caseTimes = [];
  for (const c of cases) {
    const photos = Object.entries(c.photos).map(([slot, file]) => {
      const p = path.resolve(path.dirname(casesFile), file);
      const type = TYPES[path.extname(p).toLowerCase()];
      if (!type) throw new Error(`${c.id}: unsupported image ${file}`);
      return { slot, type, data: fs.readFileSync(p).toString("base64") };
    });
    process.stdout.write(`${c.id} … `);
    const t0 = Date.now();
    let report;
    try {
      report = await core.analyze({ act: c.act, district: c.district || "العزيزية", lang: c.lang || "ar", photos });
    } catch (e) {
      console.log(`error: ${e.code || e.message}`);
      rows.push({ case: c.id, error: e.code || e.message });
      continue;
    }
    const secs = (Date.now() - t0) / 1000;
    caseTimes.push(secs);
    console.log(`score ${report.score}%  (${secs.toFixed(1)} s)`);
    for (const [code, expected] of Object.entries(c.expected)) {
      const got = report.results.find(r => r.code === code);
      rows.push({ case: c.id, code, expected, got: got ? got.status : "missing", observation: got && got.observation });
    }
  }

  const judged = rows.filter(r => r.expected && r.got);
  const decided = judged.filter(r => r.got === "pass" || r.got === "fail");
  const correct = decided.filter(r => r.got === r.expected);
  const review = judged.filter(r => r.got === "needs_review");
  const missed = judged.filter(r => r.expected === "fail" && r.got === "pass");
  const falseAlarm = judged.filter(r => r.expected === "pass" && r.got === "fail");
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0) + "%";
  const avg = caseTimes.length ? (caseTimes.reduce((x, y) => x + y, 0) / caseTimes.length).toFixed(1) : "—";

  const md = [
    `# نتيجة اختبار دقة مُيسّر`,
    ``,
    `- الحالات: ${cases.length} · البنود المقيّمة: ${judged.length} · النموذج: ${core.MODEL}`,
    `- **الدقة في البنود التي حكم عليها النظام (مطابق/يحتاج تعديل): ${pct(correct.length, decided.length)}** (${correct.length} من ${decided.length})`,
    `- نسبة «يحتاج مراجعة» بدل التخمين: ${pct(review.length, judged.length)}`,
    `- ملاحظات فاتت النظام (الخبير قال يحتاج تعديل والنظام قال مطابق): ${missed.length}`,
    `- إنذارات خاطئة (الخبير قال مطابق والنظام قال يحتاج تعديل): ${falseAlarm.length}`,
    `- متوسط زمن الفحص: ${avg} ثانية`,
    ``,
    `## البنود التي اختلف فيها النظام مع الخبير`,
    ``,
    `| الحالة | البند | الخبير | النظام | ما رآه النظام |`,
    `| --- | --- | --- | --- | --- |`,
    ...judged.filter(r => r.got !== r.expected).map(r => `| ${r.case} | ${r.code} | ${r.expected} | ${r.got} | ${(r.observation || "").replace(/\|/g, "/")} |`),
    ``
  ].join("\n");

  const out = path.join(DIR, "results");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "report.md"), md);
  fs.writeFileSync(path.join(out, "details.json"), JSON.stringify(rows, null, 2));
  console.log("\n" + md.split("\n").slice(0, 9).join("\n"));
  console.log(`\nFull report: ${path.relative(process.cwd(), path.join(out, "report.md"))}`);
}

main().catch(e => { console.error(e); process.exit(1); });
