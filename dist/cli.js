#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli.ts
var import_fs = require("fs");
var import_path = require("path");
var import_commander = require("commander");

// src/lib/banner.ts
var import_figlet = __toESM(require("figlet"));
var import_picocolors = __toESM(require("picocolors"));
function showBanner() {
  const width = process.stdout.columns || 80;
  const font = width >= 100 ? "ANSI Shadow" : "Small";
  try {
    const text = import_figlet.default.textSync("RepoPulse", { font });
    console.log(import_picocolors.default.white(text));
  } catch {
    const fallback = import_figlet.default.textSync("RepoPulse", { font: "Standard" });
    console.log(import_picocolors.default.white(fallback));
  }
  console.log(import_picocolors.default.gray("  GitHub repository analytics charts\n"));
}

// src/commands/repo.ts
var import_ora = __toESM(require("ora"));
var import_picocolors4 = __toESM(require("picocolors"));
var import_prompts2 = require("@clack/prompts");

// src/lib/setup.ts
var import_prompts = require("@clack/prompts");
var import_child_process = require("child_process");
var import_picocolors2 = __toESM(require("picocolors"));
var import_os = __toESM(require("os"));
function detectPlatform() {
  const platform = import_os.default.platform();
  if (platform === "darwin") return "macos";
  if (platform === "win32") return "windows";
  if (platform === "linux") {
    try {
      (0, import_child_process.execSync)("which apt-get", { stdio: "ignore" });
      return "linux-apt";
    } catch {
    }
    try {
      (0, import_child_process.execSync)("which dnf", { stdio: "ignore" });
      return "linux-dnf";
    } catch {
    }
    try {
      (0, import_child_process.execSync)("which pacman", { stdio: "ignore" });
      return "linux-pacman";
    } catch {
    }
  }
  return "unknown";
}
function getInstallOptions(platform) {
  const options = [];
  if (platform === "macos") {
    options.push(
      { label: "Homebrew", hint: "brew install gh", cmd: ["brew", "install", "gh"] },
      { label: "MacPorts", hint: "sudo port install gh", cmd: ["sudo", "port", "install", "gh"] }
    );
  } else if (platform === "linux-apt") {
    options.push({
      label: "apt (Debian/Ubuntu)",
      hint: "sudo apt install gh",
      cmd: ["sudo", "apt", "install", "-y", "gh"]
    });
  } else if (platform === "linux-dnf") {
    options.push({
      label: "dnf (Fedora/RHEL)",
      hint: "sudo dnf install gh",
      cmd: ["sudo", "dnf", "install", "-y", "gh"]
    });
  } else if (platform === "linux-pacman") {
    options.push({
      label: "pacman (Arch)",
      hint: "sudo pacman -S github-cli",
      cmd: ["sudo", "pacman", "-S", "--noconfirm", "github-cli"]
    });
  } else if (platform === "windows") {
    options.push(
      { label: "winget", hint: "winget install GitHub.cli", cmd: ["winget", "install", "GitHub.cli"] },
      { label: "Scoop", hint: "scoop install gh", cmd: ["scoop", "install", "gh"] },
      { label: "Chocolatey", hint: "choco install gh", cmd: ["choco", "install", "gh"] }
    );
  }
  return options;
}
function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    const [bin, ...args] = cmd;
    const proc = (0, import_child_process.spawn)(bin, args, { stdio: "inherit" });
    proc.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(new Error(`Command not found: ${bin}`));
      } else {
        reject(err);
      }
    });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${bin} exited with code ${code}`));
    });
  });
}
function isGhInstalled() {
  try {
    (0, import_child_process.execSync)("gh --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
async function ensureGhReady() {
  if (isGhInstalled()) return;
  console.log("");
  (0, import_prompts.intro)(import_picocolors2.default.bgWhite(import_picocolors2.default.black(" RepoPulse setup ")));
  (0, import_prompts.note)(
    `${import_picocolors2.default.bold("GitHub CLI (gh)")} is required but not installed.
It handles authentication so you never need to manage tokens.`,
    "Missing dependency"
  );
  const shouldInstall = await (0, import_prompts.confirm)({
    message: "Install GitHub CLI now?",
    initialValue: true
  });
  if (shouldInstall !== true) {
    (0, import_prompts.cancel)("Install gh manually from https://cli.github.com and re-run repopulse.");
    process.exit(0);
  }
  const platform = detectPlatform();
  const options = getInstallOptions(platform);
  if (options.length === 0) {
    (0, import_prompts.cancel)(
      `Could not detect a supported package manager.
Install gh manually: https://cli.github.com`
    );
    process.exit(1);
  }
  let installCmd;
  if (options.length === 1) {
    installCmd = options[0].cmd;
    (0, import_prompts.note)(`Will run: ${import_picocolors2.default.cyan(options[0].hint)}`, "Install command");
  } else {
    const choice = await (0, import_prompts.select)({
      message: "Choose a package manager:",
      options: options.map((o) => ({
        value: o.cmd.join(" "),
        label: o.label,
        hint: o.hint
      }))
    });
    if (typeof choice !== "string") {
      (0, import_prompts.cancel)("Installation cancelled.");
      process.exit(0);
    }
    installCmd = choice.split(" ");
  }
  const s = (0, import_prompts.spinner)();
  s.start("Installing GitHub CLI...");
  try {
    await runCommand(installCmd);
    s.stop("GitHub CLI installed.");
  } catch (err) {
    s.stop("Installation failed.");
    (0, import_prompts.cancel)(err.message);
    process.exit(1);
  }
  if (!isGhInstalled()) {
    (0, import_prompts.cancel)("gh was not found after install. You may need to restart your terminal.");
    process.exit(1);
  }
  (0, import_prompts.note)(
    `You'll be prompted to authenticate with GitHub.
This only needs to happen once.`,
    "Next: authenticate"
  );
  const shouldAuth = await (0, import_prompts.confirm)({
    message: "Run gh auth login now?",
    initialValue: true
  });
  if (shouldAuth !== true) {
    (0, import_prompts.cancel)("Run `gh auth login` then re-run repopulse.");
    process.exit(0);
  }
  try {
    await runCommand(["gh", "auth", "login"]);
  } catch (err) {
    (0, import_prompts.cancel)(`Authentication failed: ${err.message}`);
    process.exit(1);
  }
  (0, import_prompts.outro)(import_picocolors2.default.green("\u2714 GitHub CLI is ready. Continuing\u2026"));
  console.log("");
}

// src/lib/github.ts
var import_child_process2 = require("child_process");
function ghSpawn(args) {
  return new Promise((resolve, reject) => {
    const proc = (0, import_child_process2.spawn)("gh", args);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(new Error("GitHub CLI (gh) not found. Install it: https://cli.github.com"));
      } else {
        reject(err);
      }
    });
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `gh exited with code ${code}`));
      } else {
        resolve(stdout);
      }
    });
  });
}
async function ghApiSingle(endpoint, extraHeaders = []) {
  const args = ["api", endpoint];
  for (const h of extraHeaders) args.push("--header", h);
  const raw = await ghSpawn(args);
  return JSON.parse(raw);
}
async function ghApiPaginated(endpoint, extraHeaders = [], maxPages = Infinity) {
  const results = [];
  let page = 1;
  while (page <= maxPages) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const url = `${endpoint}${sep}per_page=100&page=${page}`;
    const data = await ghApiSingle(url, extraHeaders);
    if (!Array.isArray(data) || data.length === 0) break;
    results.push(...data);
    if (data.length < 100) break;
    page++;
  }
  return results;
}
async function checkGhAuth() {
  await ghSpawn(["auth", "status"]).catch(() => {
    throw new Error("Not authenticated with GitHub CLI. Run: gh auth login");
  });
}
async function fetchStargazersSampled(owner, repo, totalStars, targetPoints = 500) {
  const totalPages = Math.max(1, Math.ceil(totalStars / 100));
  const pagesToFetch = Math.min(totalPages, Math.ceil(targetPoints / 100));
  const pageNums = pagesToFetch === 1 ? [1] : Array.from(
    { length: pagesToFetch },
    (_, i) => Math.round(1 + i / (pagesToFetch - 1) * (totalPages - 1))
  );
  const unique = [...new Set(pageNums)];
  const results = await Promise.all(
    unique.map(
      (page) => ghApiSingle(
        `/repos/${owner}/${repo}/stargazers?per_page=100&page=${page}`,
        ["Accept: application/vnd.github.v3.star+json"]
      ).catch(() => [])
    )
  );
  return results.flat().sort((a, b) => a.starred_at.localeCompare(b.starred_at));
}
async function fetchCommits(owner, repo, maxPages) {
  return ghApiPaginated(`/repos/${owner}/${repo}/commits`, [], maxPages);
}
async function fetchContributors(owner, repo) {
  return ghApiPaginated(`/repos/${owner}/${repo}/contributors`);
}
async function fetchLanguages(owner, repo) {
  return ghApiSingle(`/repos/${owner}/${repo}/languages`);
}
async function fetchRepoInfo(owner, repo) {
  return ghApiSingle(`/repos/${owner}/${repo}`);
}

// src/lib/render.ts
var import_picocolors3 = __toESM(require("picocolors"));
var SPARK = "\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588";
function cw() {
  return Math.min((process.stdout.columns || 80) - 6, 80);
}
function fmtNum(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toLocaleString();
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}
function fmtDateLong(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function sampleTo(arr, n) {
  if (arr.length === 0 || n <= 0) return [];
  if (arr.length <= n) return arr;
  if (n === 1) return [arr[0]];
  return Array.from(
    { length: n },
    (_, i) => arr[Math.round(i / (n - 1) * (arr.length - 1))]
  );
}
function spark(values, width, color) {
  const max = Math.max(...values, 1);
  return color(
    sampleTo(values, width).map((v) => SPARK[Math.min(Math.floor(v / max * SPARK.length), SPARK.length - 1)]).join("")
  );
}
function hbar(value, max, width, color) {
  const n = Math.max(0, Math.round(value / Math.max(max, 1) * width));
  return color("\u2588".repeat(n)) + import_picocolors3.default.gray("\u2591".repeat(width - n));
}
function dateRow(width, left, right) {
  const gap = Math.max(1, width - left.length - right.length);
  return `  ${import_picocolors3.default.gray(left)}${" ".repeat(gap)}${import_picocolors3.default.gray(right)}`;
}
function renderStarsChart(data, owner, repo, totalStars) {
  const width = cw();
  console.log("");
  console.log(`  ${import_picocolors3.default.bold("\u2B50 Stars Growth")} \xB7 ${import_picocolors3.default.cyan(`${owner}/${repo}`)}`);
  console.log(`  ${import_picocolors3.default.gray(`${fmtNum(totalStars)} total stars \xB7 ${data.length.toLocaleString()} points sampled`)}`);
  console.log("");
  if (data.length === 0) {
    console.log(import_picocolors3.default.gray("  No star data available."));
    console.log("");
    return;
  }
  console.log(`  ${spark(data.map((d) => d.cumulative), width, import_picocolors3.default.yellow)}`);
  console.log(dateRow(width, fmtDate(data[0].date), fmtDate(data[data.length - 1].date)));
  console.log("");
  let peakDate = "";
  let peakDaily = 0;
  for (let i = 1; i < data.length; i++) {
    const daily = data[i].cumulative - data[i - 1].cumulative;
    if (daily > peakDaily) {
      peakDaily = daily;
      peakDate = data[i].date;
    }
  }
  console.log(`  ${import_picocolors3.default.gray("First star   ")}${fmtDateLong(data[0].date)}`);
  console.log(`  ${import_picocolors3.default.gray("Latest star  ")}${fmtDateLong(data[data.length - 1].date)}`);
  if (peakDate) {
    console.log(`  ${import_picocolors3.default.gray("Peak day     ")}${fmtDateLong(peakDate)}  ${import_picocolors3.default.yellow(`+${peakDaily.toLocaleString()} stars`)}`);
  }
  console.log("");
}
function renderCommitsChart(data, owner, repo) {
  const width = cw();
  const total = data.reduce((s, d) => s + d.count, 0);
  console.log("");
  console.log(`  ${import_picocolors3.default.bold("\u{1F4CA} Commits Activity")} \xB7 ${import_picocolors3.default.cyan(`${owner}/${repo}`)}`);
  console.log(`  ${import_picocolors3.default.gray(`${total.toLocaleString()} commits \xB7 ${data.length} weeks`)}`);
  console.log("");
  if (data.length === 0) {
    console.log(import_picocolors3.default.gray("  No commit data available."));
    console.log("");
    return;
  }
  const values = data.map((d) => d.count);
  console.log(`  ${spark(values, width, import_picocolors3.default.green)}`);
  console.log(dateRow(width, fmtDate(data[0].week), fmtDate(data[data.length - 1].week)));
  console.log("");
  const max = Math.max(...values);
  const avg = Math.round(total / data.length);
  console.log(`  ${import_picocolors3.default.gray("Peak week    ")}${max.toLocaleString()} commits`);
  console.log(`  ${import_picocolors3.default.gray("Avg / week   ")}${avg.toLocaleString()} commits`);
  console.log("");
}
function renderContributorsChart(contributors, owner, repo) {
  const top = contributors.slice(0, 15);
  const maxVal = top[0]?.contributions ?? 1;
  const maxLabel = Math.max(...top.map((c) => c.login.length), 4);
  const barWidth = Math.min(cw() - maxLabel - 14, 40);
  console.log("");
  console.log(`  ${import_picocolors3.default.bold("\u{1F465} Top Contributors")} \xB7 ${import_picocolors3.default.cyan(`${owner}/${repo}`)}`);
  console.log(`  ${import_picocolors3.default.gray(`${contributors.length.toLocaleString()} total contributors`)}`);
  console.log("");
  top.forEach((c, i) => {
    const rank = import_picocolors3.default.gray(`${String(i + 1).padStart(2)}  `);
    const label = c.login.padEnd(maxLabel);
    const bar = hbar(c.contributions, maxVal, barWidth, import_picocolors3.default.magenta);
    const count = import_picocolors3.default.gray(c.contributions.toLocaleString());
    console.log(`  ${rank}${label}  ${bar}  ${count}`);
  });
  console.log("");
}
var LANG_COLOR = {
  TypeScript: import_picocolors3.default.blue,
  JavaScript: import_picocolors3.default.yellow,
  Python: import_picocolors3.default.blue,
  Go: import_picocolors3.default.cyan,
  Ruby: import_picocolors3.default.red,
  CSS: import_picocolors3.default.magenta,
  HTML: import_picocolors3.default.red,
  Shell: import_picocolors3.default.green,
  Vue: import_picocolors3.default.green,
  Svelte: import_picocolors3.default.red,
  Kotlin: import_picocolors3.default.magenta,
  Swift: import_picocolors3.default.red,
  Rust: import_picocolors3.default.yellow,
  Dart: import_picocolors3.default.cyan
};
function renderLanguagesChart(languages, owner, repo) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a).slice(0, 10);
  const maxLabel = Math.max(...sorted.map(([l]) => l.length), 4);
  const barWidth = Math.min(cw() - maxLabel - 10, 40);
  console.log("");
  console.log(`  ${import_picocolors3.default.bold("\u{1F310} Languages")} \xB7 ${import_picocolors3.default.cyan(`${owner}/${repo}`)}`);
  console.log("");
  sorted.forEach(([lang, bytes]) => {
    const pct = bytes / total * 100;
    const label = lang.padEnd(maxLabel);
    const color = LANG_COLOR[lang] ?? import_picocolors3.default.white;
    const bar = hbar(bytes, total, barWidth, color);
    const pctStr = `${pct.toFixed(1)}%`.padStart(6);
    console.log(`  ${label}  ${bar}  ${import_picocolors3.default.gray(pctStr)}`);
  });
  console.log("");
}

// src/lib/charts.ts
var import_canvas = require("@napi-rs/canvas");
var import_chart = require("chart.js");
var import_promises = require("fs/promises");
import_chart.Chart.register(...import_chart.registerables);
function sampleData(data, maxPoints) {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0 || i === data.length - 1);
}
function fmtNumber(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(Math.round(n));
}
function fmtDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}
async function generateStarsSVG(data, owner, repo, totalStars, outputPath) {
  const svg = buildStarsSVG(data, owner, repo, totalStars);
  await (0, import_promises.writeFile)(outputPath, svg, "utf-8");
}
function buildStarsSVG(data, owner, repo, totalStars) {
  const W = 800;
  const H = 300;
  const pad = { top: 70, right: 40, bottom: 50, left: 65 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const sampled = sampleData(data, 80);
  if (sampled.length < 2) {
    sampled.push({ date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0], cumulative: totalStars });
  }
  const maxVal = Math.max(...sampled.map((d) => d.cumulative), 1);
  const toX = (i) => pad.left + i / (sampled.length - 1) * cW;
  const toY = (v) => pad.top + cH - v / maxVal * cH;
  const pts = sampled.map((d, i) => ({ x: toX(i), y: toY(d.cumulative) }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fillPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(pad.top + cH).toFixed(1)} L${pad.left},${(pad.top + cH).toFixed(1)} Z`;
  const gridLines = Array.from({ length: 5 }, (_, i) => ({
    y: pad.top + i / 4 * cH,
    value: maxVal * (1 - i / 4)
  }));
  const xIdxs = [0, Math.floor(sampled.length / 2), sampled.length - 1];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#58a6ff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#58a6ff" stop-opacity="0.02"/>
    </linearGradient>
    <clipPath id="chartClip">
      <rect x="${pad.left}" y="${pad.top}" width="${cW}" height="${cH}"/>
    </clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="#0d1117" rx="10" ry="10"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#30363d" stroke-width="1" rx="10" ry="10"/>

  <text x="${W / 2}" y="28" text-anchor="middle" fill="#e6edf3" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="15" font-weight="600">&#11088; Stars Growth &#183; ${owner}/${repo}</text>
  <text x="${W / 2}" y="50" text-anchor="middle" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="12">${fmtNumber(totalStars)} total stars</text>

  ${gridLines.map(
    ({ y, value }) => `
  <line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${W - pad.right}" y2="${y.toFixed(1)}" stroke="#21262d" stroke-width="1"/>
  <text x="${pad.left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="10">${fmtNumber(value)}</text>`
  ).join("")}

  <g clip-path="url(#chartClip)">
    <path d="${fillPath}" fill="url(#areaGrad)"/>
    <path d="${linePath}" fill="none" stroke="#58a6ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + cH}" stroke="#30363d" stroke-width="1"/>
  <line x1="${pad.left}" y1="${pad.top + cH}" x2="${W - pad.right}" y2="${pad.top + cH}" stroke="#30363d" stroke-width="1"/>

  ${xIdxs.filter((i) => i < sampled.length).map(
    (i) => `<text x="${toX(i).toFixed(1)}" y="${(pad.top + cH + 18).toFixed(1)}" text-anchor="middle" fill="#8b949e" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="10">${fmtDateShort(sampled[i].date)}</text>`
  ).join("\n  ")}
</svg>`;
}

// src/commands/repo.ts
var DEFAULT_COMMIT_PAGES = 10;
async function handleRepo(repo, options) {
  const parts = repo.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    console.error(import_picocolors4.default.red("Error: Repository must be in owner/repo format (e.g., vercel/next.js)"));
    process.exit(1);
  }
  const [owner, repoName] = parts;
  await ensureGhReady();
  const authSpinner = (0, import_ora.default)({ text: "Checking gh auth...", color: "gray" }).start();
  try {
    await checkGhAuth();
    authSpinner.stop();
  } catch {
    authSpinner.stop();
    console.log("");
    const shouldLogin = await (0, import_prompts2.confirm)({
      message: "Not logged in to GitHub CLI. Run gh auth login now?",
      initialValue: true
    });
    if (shouldLogin !== true) {
      (0, import_prompts2.cancel)("Run `gh auth login` then re-run repopulse.");
      process.exit(0);
    }
    const { spawn: spawn3 } = await import("child_process");
    await new Promise((resolve, reject) => {
      const proc = spawn3("gh", ["auth", "login"], { stdio: "inherit" });
      proc.on("close", (code) => code === 0 ? resolve() : reject());
      proc.on("error", reject);
    }).catch(() => {
      console.error(import_picocolors4.default.red("Authentication failed. Run `gh auth login` manually."));
      process.exit(1);
    });
  }
  const spinner2 = (0, import_ora.default)({
    text: `Fetching data for ${import_picocolors4.default.cyan(`${owner}/${repoName}`)}...`,
    color: "cyan"
  }).start();
  try {
    if (options.readmeStars) {
      spinner2.text = "Fetching repo info...";
      const repoInfo = await fetchRepoInfo(owner, repoName);
      spinner2.text = `Sampling star history (${fmtNum2(repoInfo.stargazers_count)} stars)...`;
      const stargazers = await fetchStargazersSampled(owner, repoName, repoInfo.stargazers_count);
      const starsData = processStarsData(stargazers);
      spinner2.text = "Generating SVG...";
      const outputPath = options.output ?? "stars.svg";
      await generateStarsSVG(starsData, owner, repoName, repoInfo.stargazers_count, outputPath);
      spinner2.succeed(`Generated ${import_picocolors4.default.green(outputPath)}`);
      console.log(`
${import_picocolors4.default.gray("README embed:")}`);
      console.log(import_picocolors4.default.cyan(`![Stars Growth](${outputPath})`));
      return;
    }
    switch (options.chart) {
      case "stars": {
        spinner2.text = "Fetching repo info...";
        const repoInfo = await fetchRepoInfo(owner, repoName);
        spinner2.text = `Sampling star history (${fmtNum2(repoInfo.stargazers_count)} stars)...`;
        const stargazers = await fetchStargazersSampled(owner, repoName, repoInfo.stargazers_count);
        spinner2.stop();
        renderStarsChart(processStarsData(stargazers), owner, repoName, repoInfo.stargazers_count);
        break;
      }
      case "commits": {
        const maxPages = options.all ? Infinity : DEFAULT_COMMIT_PAGES;
        spinner2.text = "Fetching commits...";
        const commits = await fetchCommits(owner, repoName, maxPages);
        spinner2.stop();
        renderCommitsChart(processCommitsData(commits), owner, repoName);
        if (!options.all && commits.length >= maxPages * 100) {
          console.log(import_picocolors4.default.yellow("  \u26A0  Showing partial history. Use --all for the full dataset.\n"));
        }
        break;
      }
      case "contributors": {
        spinner2.text = "Fetching contributors...";
        const contributors = await fetchContributors(owner, repoName);
        spinner2.stop();
        renderContributorsChart(contributors, owner, repoName);
        break;
      }
      case "languages": {
        spinner2.text = "Fetching languages...";
        const languages = await fetchLanguages(owner, repoName);
        spinner2.stop();
        renderLanguagesChart(languages, owner, repoName);
        break;
      }
      default: {
        spinner2.fail(`Unknown chart type: ${options.chart}`);
        console.error(import_picocolors4.default.red("Supported types: stars, commits, contributors, languages"));
        process.exit(1);
      }
    }
  } catch (err) {
    spinner2.fail("Failed to fetch data");
    console.error(import_picocolors4.default.red(err.message));
    process.exit(1);
  }
}
function fmtNum2(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toLocaleString();
}
function processStarsData(stargazers) {
  const byDay = /* @__PURE__ */ new Map();
  for (const s of stargazers) {
    const d = s.starred_at.split("T")[0];
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  let cum = 0;
  return Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, n]) => {
    cum += n;
    return { date, cumulative: cum };
  });
}
function processCommitsData(commits) {
  const byWeek = /* @__PURE__ */ new Map();
  for (const c of commits) {
    const w = weekStart(new Date(c.commit.author.date));
    byWeek.set(w, (byWeek.get(w) ?? 0) + 1);
  }
  return Array.from(byWeek.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([week, count]) => ({ week, count }));
}
function weekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().split("T")[0];
}

// src/cli.ts
var pkg = JSON.parse(
  (0, import_fs.readFileSync)((0, import_path.join)(__dirname, "..", "package.json"), "utf-8")
);
var isVersionOrHelp = process.argv.some((a) => a === "-v" || a === "--version");
if (!isVersionOrHelp) showBanner();
var program = new import_commander.Command();
program.name("repopulse").description("GitHub repository analytics charts").version(pkg.version, "-v, --version").helpOption("-h, --help").argument("<repo>", "Repository in owner/repo format (e.g., vercel/next.js)").option("--chart <type>", "Chart type: stars | commits | contributors | languages", "stars").option("--readme-stars", "Generate a stars.svg badge for README embedding").option("--output <path>", "Output file path (default: <type>-chart.png or stars.svg)").option("--all", "Fetch all pages \u2014 may be slow for large repos").action(handleRepo);
program.parse();
