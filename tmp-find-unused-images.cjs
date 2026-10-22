const fs = require("fs");
const path = require("path");

const imgRoot = path.join("src", "assets", "images");
const imageExts = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".psd"]);
const textExts = new Set([".js", ".jsx", ".ts", ".tsx", ".css", ".html", ".json", ".md"]);

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist") continue;
      walk(p, acc);
    } else acc.push(p);
  }
  return acc;
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const images = walk(imgRoot).filter((p) => imageExts.has(path.extname(p).toLowerCase()));
const texts = walk("src").filter((p) => textExts.has(path.extname(p).toLowerCase()));
for (const extra of ["index.html", "vite.config.js"]) {
  if (fs.existsSync(extra)) texts.push(extra);
}

const referenced = new Set();
const rawRefs = [];

for (const file of texts) {
  const raw = stripComments(fs.readFileSync(file, "utf8"));
  const fileDir = path.dirname(file);

  const importRe = /from\s+["']([^"']+\.(?:png|jpe?g|gif|webp|svg|psd))["']/gi;
  let m;
  while ((m = importRe.exec(raw))) {
    const spec = m[1];
    let abs;
    if (spec.includes("assets/images/")) {
      abs = path.join(imgRoot, spec.split("assets/images/")[1]);
    } else {
      abs = path.resolve(fileDir, spec);
    }
    const rel = path.relative(imgRoot, abs).split(path.sep).join("/");
    referenced.add(rel.toLowerCase());
    rawRefs.push(rel);
  }

  const urlRe = /["'`]([^"'`]*(?:assets\/images\/|\.\/)[^"'`]+\.(?:png|jpe?g|gif|webp|svg|psd))["'`]/gi;
  while ((m = urlRe.exec(raw))) {
    const spec = m[1];
    let abs;
    if (spec.includes("assets/images/")) {
      abs = path.join(imgRoot, spec.split("assets/images/")[1]);
    } else if (spec.startsWith("./") || spec.startsWith("../")) {
      abs = path.resolve(fileDir, spec);
    } else continue;
    const rel = path.relative(imgRoot, abs).split(path.sep).join("/");
    if (rel.startsWith("..")) continue;
    referenced.add(rel.toLowerCase());
    rawRefs.push(rel);
  }
}

const unused = [];
const used = [];
for (const img of images) {
  const rel = path.relative(imgRoot, img).split(path.sep).join("/");
  if (referenced.has(rel.toLowerCase())) used.push(rel);
  else unused.push(rel);
}

const missing = [...referenced].filter((rel) => {
  const abs = path.join(imgRoot, rel);
  return !images.some((img) => path.relative(imgRoot, img).split(path.sep).join("/").toLowerCase() === rel);
});

console.log("TOTAL " + images.length);
console.log("REFS " + referenced.size);
console.log("USED " + used.length);
console.log("UNUSED " + unused.length);
console.log("MISSING_REFS " + missing.length);
missing.forEach((r) => console.log("MISSING " + r));
console.log("---UNUSED---");
unused.forEach((u) => console.log(u));
