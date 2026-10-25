#!/usr/bin/env node
/**
 * Capture light/dark screenshots of the OpenTelemetry inspector panel.
 *
 * Usage:
 *   node capture.mjs [traces|logs|metrics]
 *
 * Env:
 *   BASE_URL   Inspector origin (default http://localhost:3000)
 *   OUT_DIR    Output directory (default <repo>/docs/public/images)
 *   PW_PROFILE Playwright Edge profile dir (default <tmp>/otel-shots-profile)
 *
 * Requires `playwright` installed next to this script (see SKILL.md).
 */
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const TABS = { traces: 'Traces', logs: 'Logs', metrics: 'Metrics' }
const signal = (process.argv[2] || 'metrics').toLowerCase()
const tab = TABS[signal]
if (!tab) throw new Error(`Unknown signal "${signal}". Use traces, logs or metrics.`)

const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const repoImages = path.join(repoRoot, 'docs/public/images')
const outDir = process.env.OUT_DIR || (existsSync(path.join(repoRoot, 'package.json')) ? repoImages : path.resolve('docs/public/images'))
const profile = process.env.PW_PROFILE || path.join(tmpdir(), 'otel-shots-profile')

async function capture(page, scheme) {
  await page.goto(`${baseUrl}/__opentelemetry/`, { waitUntil: 'load', timeout: 60_000 })
  await page.evaluate(s => localStorage.setItem('devframes-color-scheme', s), scheme)
  await page.reload({ waitUntil: 'load', timeout: 60_000 })
  await page.getByRole('button', { name: tab, exact: true }).first().click()

  await page.waitForFunction(
    sig => {
      const text = document.body.innerText
      if (sig === 'traces') return !text.includes('No traces yet') && !text.includes('Waiting for traces')
      if (sig === 'logs') return !text.includes('No logs yet') && !text.includes('Waiting for logs')
      return text.includes('points') && !text.includes('No metrics yet')
    },
    signal,
    { timeout: 30_000 },
  )
  // Let charts/sparklines settle after the data arrives.
  await page.waitForTimeout(2_500)

  const file = path.join(outDir, `${signal}-${scheme}.png`)
  await page.screenshot({ path: file })
  const confirmed = await page.evaluate(() => document.documentElement.className)
  console.log(`[${scheme}] html.class="${confirmed}" -> ${file}`)
}

const ctx = await chromium.launchPersistentContext(profile, {
  channel: 'msedge',
  headless: true,
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
})

try {
  await mkdir(outDir, { recursive: true })
  const page = ctx.pages()[0] || await ctx.newPage()
  await capture(page, 'light')
  await capture(page, 'dark')
} finally {
  await ctx.close()
}
