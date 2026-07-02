/*
 * Build script for GalleryRoom.js.
 * Bundles the ES-module sources into:
 *   dist/gallery-room.js      — IIFE (window.GalleryRoom, CJS-compatible)
 *   dist/gallery-room.esm.js  — ES module
 *   dist/gallery-room.min.js  — comment/whitespace-stripped IIFE
 *   dist/gallery-room.css     — base styles + all themes
 *
 * No dependencies: the sources only use `import`, `export function`,
 * `export const` and a trailing `export default`, so bundling is a
 * simple concatenation with those statements rewritten.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");

const JS_SOURCES = [
  "utils/media.js",
  "utils/filter.js",
  "utils/map.js",
  "utils/depth.js",
  "gallery-room.js"
];

const CSS_SOURCES = [
  "gallery-room.css",
  "themes/white-cube.css",
  "themes/dark-room.css",
  "themes/zine-wall.css",
  "themes/portfolio-clean.css",
  "themes/school-exhibition.css",
  "themes/museum.css"
];

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const banner =
  "/*! GalleryRoom.js v" + pkg.version + " | MIT License | " + pkg.description + " */\n";

function stripModuleSyntax(code) {
  return code
    .split("\n")
    .filter((line) => !/^\s*import\s/.test(line) && !/^\s*export default\s/.test(line))
    .map((line) => line.replace(/^export\s+(function|const|class|let|var)\s/, "$1 "))
    .join("\n");
}

function bundleBody() {
  return JS_SOURCES.map((file) =>
    stripModuleSyntax(fs.readFileSync(path.join(SRC, file), "utf8")).trim()
  ).join("\n\n");
}

/* Conservative "minify": drop block comments, indentation and blank lines. */
function slim(code) {
  return code
    .replace(/\/\*![\s\S]*?\*\//g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

fs.mkdirSync(DIST, { recursive: true });

const body = bundleBody();

const iife =
  banner +
  "(function (global) {\n\"use strict\";\n\n" +
  body +
  "\n\nglobal.GalleryRoom = GalleryRoom;\n" +
  "if (typeof module !== \"undefined\" && module.exports) {\n" +
  "  module.exports = GalleryRoom;\n" +
  "}\n" +
  "})(typeof window !== \"undefined\" ? window : globalThis);\n";

const esm = banner + body + "\n\nexport default GalleryRoom;\n";

fs.writeFileSync(path.join(DIST, "gallery-room.js"), iife);
fs.writeFileSync(path.join(DIST, "gallery-room.esm.js"), esm);
fs.writeFileSync(path.join(DIST, "gallery-room.min.js"), banner + slim(iife));

const css =
  banner +
  CSS_SOURCES.map((file) => fs.readFileSync(path.join(SRC, file), "utf8")).join("\n");
fs.writeFileSync(path.join(DIST, "gallery-room.css"), css);

console.log("Built dist/gallery-room.js, gallery-room.esm.js, gallery-room.min.js, gallery-room.css");
