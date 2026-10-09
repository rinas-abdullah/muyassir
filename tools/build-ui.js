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
const logoData = "data:image/png;base64," + fs.readFileSync(process.env.LOGO_SMALL || path.join(root, "public/logo.png")).toString("base64");
const shotData = "data:image/jpeg;base64," + fs.readFileSync(path.join(root, "public/phone-shot.jpg")).toString("base64");
if (!src.includes("<!--KB-->")) throw new Error("ui/app.html is missing the <!--KB--> marker");

const head = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="مُيسّر: صوّر محلك واعرف جاهزيتك للترخيص قبل ما تقدّم">
<meta name="theme-color" content="#135547">
<link rel="icon" type="image/png" href="logo.png">
<link rel="apple-touch-icon" href="logo-512.png">
`;
const standalone = head + src.split("__LOGO__").join("logo.png").split("__SHOT__").join("phone-shot.jpg").replace("<!--KB-->", '<script src="kb.js"></script>').replace("</style>", "</style>\n</head>\n<body>") + "\n</body>\n</html>\n";
fs.writeFileSync(path.join(root, "public/index.html"), standalone);
console.log("public/index.html", standalone.length, "bytes");

const out = process.argv[2];
if (out) {
  const single = src.split("__LOGO__").join(logoData).split("__SHOT__").join(shotData).replace("<!--KB-->", "<script>\n" + kb + "\n</script>");
  fs.writeFileSync(out, single);
  console.log(out, single.length, "bytes");
}
