// Menyalin aset statis (*.html di root proyek, dan css/) ke dist/.
// Tanpa bundler/dependency build — hanya fs Node native, sesuai semangat proyek "native from scratch".
//
// HTML di root proyek mereferensikan script lewat "dist/nama.js" (supaya proyek bisa dibuka
// langsung dari root pakai Live Server). Begitu disalin ke dalam dist/, HTML dan JS-nya duduk
// satu folder, jadi prefix "dist/" pada atribut src dilepas agar tetap valid saat dist/ dijalankan
// sebagai web root sendiri (mis. oleh live-server pada "npm run dev").
import { cpSync, mkdirSync, readdirSync, readFileSync, watch, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, "dist");
const cssSrcDir = join(root, "css");
const cssDistDir = join(distDir, "css");

function copyHtml() {
  mkdirSync(distDir, { recursive: true });
  const htmlFiles = readdirSync(root, { withFileTypes: true }).filter(
    (entry) => entry.isFile() && entry.name.endsWith(".html")
  );
  for (const entry of htmlFiles) {
    const content = readFileSync(join(root, entry.name), "utf8");
    const rewritten = content.replace(/(src=")dist\/([^"]+")/g, "$1$2");
    writeFileSync(join(distDir, entry.name), rewritten);
  }
  return htmlFiles.length;
}

function copyCss() {
  cpSync(cssSrcDir, cssDistDir, { recursive: true });
}

function copyAll() {
  const count = copyHtml();
  copyCss();
  console.log(`[copy-assets] ${count} file HTML + css/ disalin ke dist/`);
}

copyAll();

if (process.argv.includes("--watch")) {
  console.log("[copy-assets] memantau perubahan pada *.html dan css/ ...");
  watch(root, { recursive: false }, (_event, filename) => {
    if (filename && filename.endsWith(".html")) copyAll();
  });
  watch(cssSrcDir, { recursive: false }, () => copyAll());
}
