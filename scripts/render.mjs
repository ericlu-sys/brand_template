#!/usr/bin/env node
// 把模板輸出成 PNG（1080×1350）。用電腦裡現成的 Chrome 或 Edge，不用另外安裝套件。
//   node scripts/render.mjs              → 全部 10 張
//   node scripts/render.mjs 01 05        → 只輸出 01 和 05
// 圖片存在 out/，檔名跟模板一樣。
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const tplDir = join(root, "templates");
const outDir = join(root, "out");
mkdirSync(outDir, { recursive: true });

const candidates = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ],
  win32: [
    join(process.env["PROGRAMFILES"] || "C:\\Program Files", "Google\\Chrome\\Application\\chrome.exe"),
    join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google\\Chrome\\Application\\chrome.exe"),
    join(process.env["LOCALAPPDATA"] || "", "Google\\Chrome\\Application\\chrome.exe"),
    join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Microsoft\\Edge\\Application\\msedge.exe"),
    join(process.env["PROGRAMFILES"] || "C:\\Program Files", "Microsoft\\Edge\\Application\\msedge.exe"),
  ],
  linux: ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"],
};
const browser = (candidates[process.platform] || []).find((p) => p && existsSync(p));
if (!browser) {
  console.error("找不到 Chrome 或 Edge。請先安裝 Google Chrome：https://www.google.com/chrome/");
  process.exit(1);
}

const want = process.argv.slice(2);
const files = readdirSync(tplDir)
  .filter((f) => /^\d\d-.*\.html$/.test(f))
  .filter((f) => !want.length || want.some((w) => f.startsWith(w.padStart(2, "0"))));
if (!files.length) {
  console.error("沒有符合的模板。可用的編號：01 到 10");
  process.exit(1);
}

const profile = join(tmpdir(), "brand-template-render");
for (const f of files) {
  const out = join(outDir, f.replace(/\.html$/, ".png"));
  execFileSync(browser, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    `--user-data-dir=${profile}`, "--window-size=1080,1350", "--virtual-time-budget=5000",
    `--screenshot=${out}`, pathToFileURL(join(tplDir, f)).href,
  ], { stdio: "ignore" });
  console.log("✓", out);
}
