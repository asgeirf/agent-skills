#!/usr/bin/env node

/**
 * record.mjs — Record an animated flow-graph as WebM/GIF
 *
 * Usage:
 *   node record.mjs <graph-data.json> <output-path> [options]
 *
 * Options:
 *   --format gif|webm|both   Output format (default: both)
 *   --width  <number>        Viewport width  (default: from graph settings or 1280)
 *   --height <number>        Viewport height (default: from graph settings or 720)
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { spawn, execSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import os from "node:os";
import net from "node:net";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, "../assets/flow-template");

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.length < 2 || args[0] === "--help" || args[0] === "-h") {
  console.log(
    "Usage: node record.mjs <graph-data.json> <output-path> [--format gif|webm|both] [--width N] [--height N]"
  );
  process.exit(args[0] === "--help" || args[0] === "-h" ? 0 : 1);
}

const graphDataPath = path.resolve(args[0]);
const outputBase = path.resolve(args[1]);

function flag(name, fallback) {
  const idx = args.indexOf(name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : fallback;
}

const format = flag("--format", "both");
const cliWidth = flag("--width", null);
const cliHeight = flag("--height", null);

// ---------------------------------------------------------------------------
// Validate inputs
// ---------------------------------------------------------------------------
if (!fs.existsSync(graphDataPath)) {
  console.error(`Error: graph data file not found: ${graphDataPath}`);
  process.exit(1);
}

const graphData = JSON.parse(fs.readFileSync(graphDataPath, "utf-8"));
const settings = graphData.settings || {};
const width = Number(cliWidth) || settings.width || 1280;
const height = Number(cliHeight) || settings.height || 720;

// ---------------------------------------------------------------------------
// Prepare temp working directory
// ---------------------------------------------------------------------------
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "flow-graph-"));
console.log(`Working directory: ${tmpDir}`);

function cleanup() {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort
  }
}

// Copy template source files (not node_modules)
for (const entry of ["package.json", "vite.config.js", "index.html", "src"]) {
  execSync(`cp -R "${TEMPLATE_DIR}/${entry}" "${tmpDir}/${entry}"`);
}

// Symlink node_modules from the template if available, otherwise install
const templateModules = path.join(TEMPLATE_DIR, "node_modules");
const tmpModules = path.join(tmpDir, "node_modules");
if (fs.existsSync(templateModules)) {
  fs.symlinkSync(templateModules, tmpModules);
} else {
  console.log("Installing dependencies...");
  execSync("npm install --prefer-offline --no-audit --no-fund", {
    cwd: tmpDir,
    stdio: "inherit",
  });
}

// Inject graph data
fs.writeFileSync(
  path.join(tmpDir, "src", "graph-data.json"),
  JSON.stringify(graphData, null, 2)
);

// ---------------------------------------------------------------------------
// Find a free port
// ---------------------------------------------------------------------------
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

const port = await getFreePort();

// ---------------------------------------------------------------------------
// Start Vite dev server as child process
// ---------------------------------------------------------------------------
console.log("Starting Vite dev server...");
const viteBin = path.join(tmpDir, "node_modules", ".bin", "vite");
const viteProc = spawn(viteBin, ["--port", String(port), "--strictPort"], {
  cwd: tmpDir,
  stdio: ["ignore", "pipe", "pipe"],
});

// Wait for Vite to be ready
const url = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("Vite startup timeout")), 30_000);
  let output = "";
  viteProc.stdout.on("data", (chunk) => {
    output += chunk.toString();
    const match = output.match(/Local:\s+(https?:\/\/[^\s]+)/);
    if (match) {
      clearTimeout(timeout);
      resolve(match[1]);
    }
  });
  viteProc.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });
  viteProc.on("exit", (code) => {
    clearTimeout(timeout);
    reject(new Error(`Vite exited with code ${code}:\n${output}`));
  });
});
console.log(`Vite running at ${url}`);

// ---------------------------------------------------------------------------
// Record with Playwright
// ---------------------------------------------------------------------------
let browser;
try {
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    recordVideo: { dir: tmpDir, size: { width, height } },
  });
  const page = await context.newPage();

  // Collect browser errors for debugging
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto(url, { waitUntil: "networkidle" });

  // Wait for animation to finish (poll __animationDone)
  console.log("Recording animation...");
  try {
    await page.waitForFunction(() => window.__animationDone === true, null, {
      timeout: 120_000,
      polling: 250,
    });
  } catch (err) {
    if (errors.length) {
      console.error("Browser errors:", errors);
    }
    const state = await page.evaluate(() => ({
      animationDone: window.__animationDone,
      bodyHTML: document.body.innerHTML.slice(0, 500),
    }));
    console.error("Page state at timeout:", state);
    throw err;
  }

  // Small extra wait for final frame stability
  await page.waitForTimeout(500);

  await page.close();
  const video = page.video();
  const videoPath = await video.path();
  await context.close();

  console.log(`Video recorded: ${videoPath}`);

  // -------------------------------------------------------------------
  // Output conversion
  // -------------------------------------------------------------------
  const outDir = path.dirname(outputBase);
  const outName = path.basename(outputBase).replace(/\.[^.]+$/, "");
  fs.mkdirSync(outDir, { recursive: true });

  const webmOut = path.join(outDir, `${outName}.webm`);
  const gifOut = path.join(outDir, `${outName}.gif`);

  if (format === "webm" || format === "both") {
    fs.copyFileSync(videoPath, webmOut);
    console.log(`WebM saved: ${webmOut}`);
  }

  if (format === "gif" || format === "both") {
    console.log("Converting to GIF (ffmpeg)...");
    const palette = path.join(tmpDir, "palette.png");
    execFileSync("ffmpeg", [
      "-y",
      "-i", videoPath,
      "-vf", `fps=15,scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`,
      palette,
    ], { stdio: "pipe" });
    execFileSync("ffmpeg", [
      "-y",
      "-i", videoPath,
      "-i", palette,
      "-lavfi", `fps=15,scale=${width}:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
      gifOut,
    ], { stdio: "pipe" });
    console.log(`GIF saved: ${gifOut}`);
  }
} finally {
  if (browser) await browser.close();
  viteProc.kill();
  cleanup();
}

console.log("Done!");
