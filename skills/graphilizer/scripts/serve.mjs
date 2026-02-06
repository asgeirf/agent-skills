#!/usr/bin/env node

/**
 * serve.mjs — Serve a graphilizer animation in the browser
 *
 * Usage:
 *   node serve.mjs <graph-data.json> [options]
 *
 * Options:
 *   --port <number>   Preferred port (default: find free port)
 *   --open            Open browser after server starts
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { spawn, exec } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, "../assets/graphilizer-template");

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.length < 1 || args[0] === "--help" || args[0] === "-h") {
  console.log(
    "Usage: node serve.mjs <graph-data.json> [--port N] [--open]"
  );
  process.exit(args[0] === "--help" || args[0] === "-h" ? 0 : 1);
}

const graphDataPath = path.resolve(args[0]);

function flag(name, fallback) {
  const idx = args.indexOf(name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : fallback;
}

const preferredPort = flag("--port", null);
const shouldOpen = args.includes("--open");

// ---------------------------------------------------------------------------
// Validate inputs
// ---------------------------------------------------------------------------
if (!fs.existsSync(graphDataPath)) {
  console.error(`Error: graph data file not found: ${graphDataPath}`);
  process.exit(1);
}

let graphData;
try {
  graphData = JSON.parse(fs.readFileSync(graphDataPath, "utf-8"));
} catch (err) {
  console.error(`Error: invalid JSON in ${graphDataPath}: ${err.message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Prepare temp working directory
// ---------------------------------------------------------------------------
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "graphilizer-"));
console.log(`Working directory: ${tmpDir}`);

// Copy template source files (not node_modules)
for (const entry of ["package.json", "vite.config.js", "index.html", "src"]) {
  fs.cpSync(path.join(TEMPLATE_DIR, entry), path.join(tmpDir, entry), { recursive: true });
}

// Symlink node_modules from the template if available, otherwise install
const templateModules = path.join(TEMPLATE_DIR, "node_modules");
const tmpModules = path.join(tmpDir, "node_modules");
if (fs.existsSync(templateModules)) {
  fs.symlinkSync(templateModules, tmpModules);
} else {
  console.log("Installing dependencies...");
  const { execSync } = await import("node:child_process");
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
function findFreePort(preferred) {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(preferred || 0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", () => {
      if (preferred) {
        // Preferred port taken, find any free port
        const srv2 = net.createServer();
        srv2.listen(0, () => {
          const port = srv2.address().port;
          srv2.close(() => resolve(port));
        });
      } else {
        reject(new Error("Could not find free port"));
      }
    });
  });
}

const port = await findFreePort(preferredPort ? Number(preferredPort) : null);

// ---------------------------------------------------------------------------
// Start Vite dev server as child process
// ---------------------------------------------------------------------------
console.log("Starting Vite dev server...");
const viteBin = path.join(tmpDir, "node_modules", ".bin", "vite");
const viteProc = spawn(viteBin, ["--port", String(port), "--strictPort"], {
  cwd: tmpDir,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, NO_COLOR: "1" },
});

// Wait for Vite to be ready
const serverUrl = await new Promise((resolve, reject) => {
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

console.log(`Vite running at ${serverUrl}`);
console.log(`GRAPHILIZER_URL=http://localhost:${port}`);

// ---------------------------------------------------------------------------
// Open browser if requested
// ---------------------------------------------------------------------------
if (shouldOpen) {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${cmd} http://localhost:${port}`);
}

// ---------------------------------------------------------------------------
// Graceful cleanup
// ---------------------------------------------------------------------------
function cleanup() {
  console.log("\nShutting down...");
  viteProc.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
