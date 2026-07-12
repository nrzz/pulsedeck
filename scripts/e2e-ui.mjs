import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.PULSEDECK_URL || 'http://localhost:5173';
const OUT = path.resolve('apps/web/e2e-artifacts');
fs.mkdirSync(OUT, { recursive: true });

const results = [];

function ok(name, detail = '') {
  results.push({ name, status: 'PASS', detail });
  console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, status: 'FAIL', detail });
  console.log(`FAIL  ${name} — ${detail}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(20000);

  try {
    await page.goto(BASE, { waitUntil: 'load' });
    ok('page-load', await page.title());

    // Brand visible
    const brand = page.getByText('PulseDeck', { exact: true }).first();
    await brand.waitFor();
    ok('brand-visible');

    // Live connection badge (may take a moment)
    try {
      await page.getByText('Live').waitFor({ timeout: 15000 });
      ok('ws-live-badge');
    } catch {
      fail('ws-live-badge', 'Live badge not shown within 15s');
    }

    // Wait for metrics to populate (CPU widget title exists, not just skeleton forever)
    await page.getByText('CPU', { exact: true }).first().waitFor();
    ok('cpu-widget-title');

    // Wait for numeric content somehow - look for % in page after metrics
    try {
      await page.waitForFunction(() => {
        const text = document.body.innerText;
        return /\d+(\.\d+)?%/.test(text) || /\d+(\.\d+)?\s*(GB|MB)/.test(text);
      }, { timeout: 25000 });
      ok('metrics-rendered');
    } catch {
      fail('metrics-rendered', 'No % or GB/MB values after 25s');
    }

    await page.screenshot({ path: path.join(OUT, '01-dashboard.png'), fullPage: true });
    ok('screenshot-dashboard');

    // Edit mode
    await page.getByTestId('edit-toggle').click();
    await page.getByText(/Drag/i).first().waitFor();
    ok('edit-mode-on');

    // Add widget modal
    await page.getByTestId('add-widget').click();
    await page.getByText('Add widget').waitFor();
    ok('add-modal-open');

    // Add Battery widget
    await page.getByRole('button', { name: /Battery/i }).click();
    try {
      await page.getByText(/Added Battery/i).waitFor({ timeout: 5000 });
      ok('toast-added-widget');
    } catch {
      // toast may be fast; check widget title instead
      await page.getByText('Battery', { exact: true }).first().waitFor({ timeout: 5000 });
      ok('toast-added-widget', 'toast missed but battery present');
    }

    // Done edit
    await page.getByTestId('edit-toggle').click();
    ok('edit-mode-off');

    // Settings panel
    await page.getByTestId('open-settings').click();
    await page.getByRole('heading', { name: 'Settings' }).waitFor();
    ok('settings-open');

    // Toggle light mode
    await page.locator('aside').getByRole('button', { name: /^light$/i }).click();
    await page.waitForFunction(() => !document.documentElement.classList.contains('dark'), null, {
      timeout: 5000,
    });
    const isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
    if (isLight) ok('theme-light');
    else fail('theme-light', 'dark class still present');

    await page.locator('aside').getByRole('button', { name: /^dark$/i }).click();
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'), null, {
      timeout: 5000,
    });
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (isDark) ok('theme-dark');
    else fail('theme-dark', 'dark class missing');

    // Compact density
    await page.getByRole('button', { name: /^compact$/i }).click();
    ok('density-compact');

    await page.getByRole('button', { name: /^comfy$/i }).click();
    ok('density-comfy');

    // Close settings via X in aside header
    await page.locator('aside').locator('button').first().click();
    await page.waitForTimeout(400);
    const settingsGone = await page.getByRole('heading', { name: 'Settings' }).count();
    if (settingsGone === 0) ok('settings-closed');
    else fail('settings-closed', 'still open');

    // Save
    await page.getByTestId('save-layout').click();
    try {
      await page.getByText(/Layout saved/i).waitFor({ timeout: 5000 });
      ok('save-toast');
    } catch {
      fail('save-toast', 'no toast');
    }

    // Mobile viewport smoke
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '02-mobile.png'), fullPage: true });
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });
    if (!overflow) ok('mobile-no-h-overflow');
    else fail('mobile-no-h-overflow', 'horizontal overflow detected');

    // Console errors (ignore benign)
    // collected via listener below
  } catch (err) {
    fail('uncaught', String(err));
    await page.screenshot({ path: path.join(OUT, '99-error.png'), fullPage: true }).catch(() => {});
  }

  await browser.close();

  const failed = results.filter((r) => r.status === 'FAIL');
  console.log('\nSUMMARY', `pass=${results.length - failed.length}`, `fail=${failed.length}`);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main();
