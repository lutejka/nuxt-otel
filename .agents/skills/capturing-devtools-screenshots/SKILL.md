---
name: capturing-devtools-screenshots
description: Use when capturing or refreshing screenshots of the OpenTelemetry DevTools panel (traces, logs, metrics) for the docs in docs/public/images, or when a docs screenshot is stale, empty, or shows no data.
---

# Capturing DevTools Screenshots

## Overview

Docs screenshots are 1920×1080 light/dark PNG pairs in `docs/public/images/`. Capture them from the standalone inspector with Playwright + Edge. The Nuxt DevTools client crashes in the Firefox-based obscura browser (`e.addEventListener is not a function`), so don't use obscura for this.

## Recipe

1. **Start a data source**
   - **Metrics:** `pnpm dev` (playground on http://localhost:3000). Runtime metrics (event loop, GC, heap) appear automatically; wait ~10s after the first request.
   - **Traces/logs fixtures:** `pnpm dev:client` in `../vite-opentelemetry-inspector` and use the printed URL (usually `http://localhost:5173/__opentelemetry/`) as `BASE_URL`.
2. **Set up a scratch dir outside the repo** (`npm i` fails inside the pnpm workspace):
   ```powershell
   mkdir "$env:TEMP\otel-shots"; cd "$env:TEMP\otel-shots"
   npm init -y; npm i playwright
   copy "<repo>\.agents\skills\capturing-devtools-screenshots\capture.mjs" .
   ```
3. **Capture from the repo root** so images land in `docs/public/images/`:
   ```powershell
   cd "<repo>"
   node "$env:TEMP\otel-shots\capture.mjs" metrics
   # fixture data from the inspector repo:
   $env:BASE_URL = "http://localhost:5173"; node "$env:TEMP\otel-shots\capture.mjs" traces
   ```
   The script opens `/__opentelemetry/`, clicks the signal tab, waits for data, and writes `<signal>-light.png` + `<signal>-dark.png`.
4. **Reference the pair** in the page:
   ```md
   :zoomable-color-mode-image{alt="Metrics view tiles with latest values, sparklines and histogram charts" class="w-full rounded-lg border border-muted" dark="/images/metrics-dark.png" light="/images/metrics-light.png" width="1920" height="1080" loading="lazy"}
   ```

## Quick reference

| Thing | Value |
|---|---|
| Panel URL | `${BASE_URL}/__opentelemetry/` (same UI the DevTools tab iframes) |
| Theme | `localStorage['devframes-color-scheme']` = `light` or `dark`, then reload |
| Viewport | 1920×1080 @1x, headless Edge via `channel: 'msedge'` |
| Data wait | metrics: body contains "points"; traces/logs: the empty-state text is gone |

## Common mistakes

- `waitUntil: 'networkidle'` on the panel — the WebSocket never closes, so navigation times out. Use `load` plus explicit waits.
- Screenshotting before the first metric export (5s interval) or before the tab renders — empty tiles.
- Using obscura/Firefox for the DevTools client — it renders a 500 `e.addEventListener is not a function`.
- Capturing at another viewport — card and grid layouts in the docs assume 1920×1080.
- Adding `disableAuthorization` to `playground/nuxt.config.ts` just to screenshot — unnecessary when using `/__opentelemetry/` directly.
