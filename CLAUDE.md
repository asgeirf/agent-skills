# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A collection of agent skills for Claude Code, distributed via [skills.sh](https://skills.sh). Currently contains one skill: **flow-graph**, which generates animated GIF/WebM videos of graph visualizations using React Flow, Playwright, and ffmpeg.

Install: `npx skills add asgeirf/agent-skills@flow-graph`

## Prerequisites

- Node.js 20+
- ffmpeg (`brew install ffmpeg`)
- Playwright Chromium (`npx playwright install chromium`)

## Setup & Running

```bash
# Install skill-level deps (Playwright)
cd skills/flow-graph && npm install --prefer-offline --no-audit --no-fund

# Install template deps (React Flow, Vite)
cd skills/flow-graph/assets/flow-template && npm install --prefer-offline --no-audit --no-fund

# Record an animation
node skills/flow-graph/scripts/record.mjs /tmp/my-graph.json ./output --format both
```

The record script accepts `--format gif|webm|both`, `--width N`, `--height N`.

## Architecture

### Recording Pipeline (`scripts/record.mjs`)

1. Copies `assets/flow-template/` source files to a temp directory
2. **Symlinks** `node_modules` from the template (avoids copying ~52MB)
3. Injects the user's `graph-data.json` into the temp dir
4. Spawns Vite as a **child process** (not `createServer()` API — see below)
5. Launches Playwright Chromium with video recording enabled
6. Polls `window.__animationDone` to know when the React animation finishes
7. Converts the recorded WebM to GIF via ffmpeg's two-pass palettegen approach
8. Cleans up temp dir

### Animation Engine (`assets/flow-template/src/App.jsx`)

A React Flow app that reads `graph-data.json` and executes animation steps sequentially. Each step type (`addNode`, `addEdge`, `highlight`, `moveNode`, `removeNode`, `removeEdge`, `updateStyle`, `fitView`, `zoom`, `pan`, `wait`) is handled in a switch-case with async delays. Nodes/edges fade in via CSS transitions (`.flow-fade-in` class in `App.css`).

Sets `window.__animationDone = true` when all steps complete — this is the signal Playwright uses to stop recording.

### Graph Data Format

Defined in `references/graph-schema.md`. A JSON file with `settings` (viewport size, background, animation duration) and `steps` (ordered array of animation instructions). The template's `src/graph-data.json` is a placeholder that gets overwritten at recording time.

### Skill Definition (`SKILL.md`)

Frontmatter defines the skill name, description, and trigger phrases. The body describes the workflow an AI agent should follow: parse user request → generate graph JSON → write to temp file → run record script.

## Key Gotcha

**Never use Vite's `createServer()` API** when the target directory has its own dependencies. Plugin resolution (e.g., `@vitejs/plugin-react`) resolves from the caller's `node_modules`, not the target's. Always spawn Vite as a child process with `cwd` set to the target directory.

## Dependencies

- **Root `package.json`**: empty (repo-level metadata only)
- **`skills/flow-graph/package.json`**: `playwright` (recording)
- **`skills/flow-graph/assets/flow-template/package.json`**: `@xyflow/react` v12, `react`, `react-dom`, `vite`, `@vitejs/plugin-react`

Note: React Flow v12 uses `@xyflow/react` (not the old `reactflow` package).
