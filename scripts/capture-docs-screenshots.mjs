/**
 * Capture fresh public docs screenshots into docs/.
 * Usage: PULSEDECK_URL=http://127.0.0.1:8787 node scripts/capture-docs-screenshots.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASE = (process.env.PULSEDECK_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const DOCS = path.join(ROOT, 'docs');

const SYSTEM_PACK = {
  id: 'preset-system',
  name: 'System',
  widgets: [
    { id: 'cpu-1', type: 'cpu', settings: {} },
    { id: 'ram-1', type: 'ram', settings: {} },
    { id: 'gpu-1', type: 'gpu', settings: {} },
    { id: 'disk-1', type: 'disk', settings: {} },
    { id: 'temps-1', type: 'temps', settings: {} },
    { id: 'net-1', type: 'network-speed', settings: {} },
    { id: 'proc-1', type: 'processes', settings: { sortBy: 'cpu', limit: 6 } },
    {
      id: 'news-1',
      type: 'news',
      settings: {
        topics: ['technology', 'world'],
        limit: 5,
        refreshMinutes: 20,
        showSource: true,
        density: 'compact',
      },
    },
  ],
  layout: [
    { i: 'cpu-1', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
    { i: 'ram-1', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
    { i: 'gpu-1', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
    { i: 'disk-1', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'temps-1', x: 0, y: 3, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'net-1', x: 3, y: 3, w: 4, h: 3, minW: 3, minH: 3 },
    { i: 'proc-1', x: 7, y: 3, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'news-1', x: 0, y: 5, w: 4, h: 4, minW: 3, minH: 3 },
  ],
};

const DESKTOP_PACK = {
  id: 'desktop',
  name: 'Desktop',
  widgets: [
    { id: 'cpu-1', type: 'cpu', settings: {} },
    { id: 'ram-1', type: 'ram', settings: {} },
    { id: 'net-1', type: 'network-speed', settings: {} },
    { id: 'clock-1', type: 'clock', settings: { timezones: ['Asia/Kolkata', 'UTC'] } },
    {
      id: 'weather-1',
      type: 'weather',
      settings: { city: 'Bangalore', lat: 12.9716, lon: 77.5946 },
    },
  ],
  layout: [
    { i: 'cpu-1', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
    { i: 'ram-1', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 3 },
    { i: 'net-1', x: 6, y: 0, w: 4, h: 3, minW: 3, minH: 3 },
    { i: 'clock-1', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 3 },
    { i: 'weather-1', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
  ],
};

async function putConfig(page, preset) {
  const cfg = await page.evaluate(async (pack) => {
    const res = await fetch('/api/config');
    const current = await res.json();
    const next = {
      ...current,
      activePresetId: pack.id,
      presets: [...(current.presets || []).filter((p) => p.id !== pack.id), pack],
      theme: {
        ...(current.theme || {}),
        mode: 'dark',
        accent: '#14b8a6',
        density: 'comfy',
        showWidgetTitles: true,
      },
      shell: {
        ...(current.shell || {}),
        scale: 1,
        gridCols: 12,
        boardOpacity: 0.45,
      },
    };
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(next),
    });
    return next;
  }, preset);
  return cfg;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  // Browser dashboard (marketing hero)
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60_000 });
  await putConfig(page, SYSTEM_PACK);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.screenshot({
    path: path.join(DOCS, 'screenshot-dashboard.png'),
    fullPage: false,
  });
  console.log('wrote docs/screenshot-dashboard.png');

  // Settings / Customize panel
  await page.getByTestId('open-settings').click();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(DOCS, 'screenshot-customize.png'),
    fullPage: false,
  });
  console.log('wrote docs/screenshot-customize.png');
  await page.keyboard.press('Escape').catch(() => undefined);
  const closeSettings = page.locator('[data-testid="close-settings"], button[aria-label="Close"]').first();
  if (await closeSettings.isVisible().catch(() => false)) {
    await closeSettings.click().catch(() => undefined);
  }
  // click backdrop / X if settings still open
  await page.locator('aside').locator('button').first().click().catch(() => undefined);
  await page.waitForTimeout(300);

  // Add widget modal (requires Edit mode first)
  await page.getByTestId('edit-toggle').click();
  await page.waitForTimeout(400);
  await page.getByTestId('add-widget').click();
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(DOCS, 'screenshot-add-widget.png'),
    fullPage: false,
  });
  console.log('wrote docs/screenshot-add-widget.png');
  await page.getByTestId('close-add-widget').click().catch(() => undefined);
  await page.keyboard.press('Escape').catch(() => undefined);

  // Widget shell (desktop-like)
  await putConfig(page, DESKTOP_PACK);
  await page.goto(`${BASE}/?shell=widget`, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForTimeout(3500);
  await page.screenshot({
    path: path.join(DOCS, 'screenshot-widget.png'),
    fullPage: false,
  });
  console.log('wrote docs/screenshot-widget.png');

  await browser.close();
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
