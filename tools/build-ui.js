"use strict";
/*
 * Builds the web interface from one source (ui/app.html):
 *   public/index.html  → the standalone platform (loads kb.js from the server)
 *   dist/muyassir-claude.html (optional, pass a path) → single-file version with kb.js inlined
 * Usage: node tools/build-ui.js [path-for-single-file-version]
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "ui/app.html"), "utf8");
const kb = fs.readFileSync(path.join(root, "public/kb.js"), "utf8");
if (!src.includes("<!--KB-->")) throw new Error("ui/app.html is missing the <!--KB--> marker");

const head = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="مُيسّر: صوّر محلك واعرف جاهزيتك للترخيص قبل ما تقدّم">
<meta name="theme-color" content="#0C4A3F">
`;
const standalone = head + src.replace("<!--KB-->", '<script src="kb.js"></script>').replace("</style>", "</style>\n</head>\n<body>") + "\n</body>\n</html>\n";
fs.writeFileSync(path.join(root, "public/index.html"), standalone);
console.log("public/index.html", standalone.length, "bytes");

const out = process.argv[2];
if (out) {
  const single = src.replace("<!--KB-->", "<script>\n" + kb + "\n</script>");
  fs.writeFileSync(out, single);
  console.log(out, single.length, "bytes");
}
