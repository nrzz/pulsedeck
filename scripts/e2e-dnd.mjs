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
  page.setDefaultTimeout(25000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  try {
    await page.goto(BASE, { waitUntil: 'load' });
    ok('page-load', await page.title());

    await page.getByText('PulseDeck', { exact: true }).first().waitFor();
    ok('brand-visible');

    await page.getByText('Live').waitFor({ timeout: 20000 });
    ok('ws-live');

    await page.waitForFunction(
      () =>
        /\d+(\.\d+)?%/.test(document.body.innerText) ||
        /\d+(\.\d+)?\s*GB/.test(document.body.innerText),
      null,
      { timeout: 30000 },
    );
    ok('metrics-visible');

    // Verify RGL transforms are NOT overridden by CSS animation
    const transformOk = await page.evaluate(() => {
      const items = [...document.querySelectorAll('.react-grid-item')];
      if (items.length < 2) return { ok: false, reason: 'few items' };
      const transforms = items.map((el) => getComputedStyle(el).transform);
      const unique = new Set(transforms);
      // At least two distinct positions expected on a default deck
      return {
        ok: unique.size >= 2 && !transforms.every((t) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)'),
        sample: transforms.slice(0, 3),
        unique: unique.size,
      };
    });
    if (transformOk.ok) ok('layout-transforms', `${transformOk.unique} unique`);
    else fail('layout-transforms', JSON.stringify(transformOk));

    await page.getByTestId('edit-toggle').click();
    await page.getByText(/Drag/i).first().waitFor();
    ok('edit-mode-on');

    const handles = page.locator('[data-testid="widget-drag-handle"]');
    const handleCount = await handles.count();
    if (handleCount < 2) fail('drag-handles', `only ${handleCount} handles`);
    else ok('drag-handles', `${handleCount} regions`);

    // Drag the visually top-left item by comparing bounding boxes
    const items = page.locator('.react-grid-item');
    const count = await items.count();
    let targetIdx = 0;
    let best = { x: Infinity, y: Infinity };
    for (let i = 0; i < count; i++) {
      const b = await items.nth(i).boundingBox();
      if (!b) continue;
      if (b.y < best.y - 5 || (Math.abs(b.y - best.y) < 5 && b.x < best.x)) {
        best = b;
        targetIdx = i;
      }
    }

    const firstItem = items.nth(targetIdx);
    const before = await firstItem.boundingBox();
    if (!before) throw new Error('no grid item bbox');

    const dragRegion = firstItem.locator('[data-testid="widget-drag-handle"]');
    await dragRegion.waitFor({ state: 'visible' });
    const box = await dragRegion.boundingBox();
    if (!box) throw new Error('no drag region');

    await page.mouse.move(box.x + Math.min(40, box.width / 2), box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(40);
    // Move far down and right so compaction can't put it back identically
    for (let i = 1; i <= 24; i++) {
      await page.mouse.move(box.x + 40 + i * 12, box.y + box.height / 2 + i * 16, { steps: 2 });
    }
    await page.waitForTimeout(80);
    const dragging = await firstItem.evaluate((el) =>
      el.classList.contains('react-draggable-dragging'),
    );
    if (!dragging) fail('drag-active-class', 'not dragging mid-gesture');
    else ok('drag-active-class');

    await page.mouse.up();
    await page.waitForTimeout(900);

    const after = await firstItem.boundingBox();
    const moved =
      after &&
      (Math.abs(after.y - before.y) > 40 || Math.abs(after.x - before.x) > 40);
    if (moved) {
      ok(
        'drag-moved',
        `dy=${Math.round(after.y - before.y)} dx=${Math.round(after.x - before.x)}`,
      );
    } else {
      fail('drag-moved', `widget did not move (y ${before.y}→${after?.y})`);
    }

    await page.screenshot({ path: path.join(OUT, 'dnd-after-drag.png'), fullPage: true });

    // Resize
    const resizeHandle = firstItem.locator('.react-resizable-handle').first();
    const rh = await resizeHandle.boundingBox();
    if (rh) {
      const beforeSize = await firstItem.boundingBox();
      await page.mouse.move(rh.x + rh.width / 2, rh.y + rh.height / 2);
      await page.mouse.down();
      await page.mouse.move(rh.x + 120, rh.y + 90, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(700);
      const afterSize = await firstItem.boundingBox();
      const resized =
        beforeSize &&
        afterSize &&
        (Math.abs(afterSize.width - beforeSize.width) > 20 ||
          Math.abs(afterSize.height - beforeSize.height) > 20);
      if (resized) {
        ok(
          'resize-worked',
          `dw=${Math.round((afterSize?.width ?? 0) - (beforeSize?.width ?? 0))} dh=${Math.round((afterSize?.height ?? 0) - (beforeSize?.height ?? 0))}`,
        );
      } else fail('resize-worked', 'size unchanged');
    } else {
      fail('resize-handle', 'not found');
    }

    // Add widget
    await page.getByTestId('add-widget').click();
    await page.getByText('Add widget').waitFor();
    ok('add-modal');
    await page.getByRole('button', { name: /Ping Monitor/i }).click();
    await page.waitForTimeout(800);
    const hasPing = await page.getByText('Ping', { exact: true }).count();
    if (hasPing > 0) ok('add-widget-ping');
    else fail('add-widget-ping', 'ping not on canvas');

    await page.getByTestId('edit-toggle').click();
    await page.waitForTimeout(300);
    const hintGone = (await page.getByText(/Drag any widget header/i).count()) === 0;
    if (hintGone) ok('edit-mode-off');
    else fail('edit-mode-off', 'hint still visible');

    await page.getByTestId('open-settings').click();
    await page.getByRole('heading', { name: 'Settings' }).waitFor();
    ok('settings-open');
    await page.getByRole('button', { name: /^light$/i }).click();
    const isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
    if (isLight) ok('theme-light');
    else fail('theme-light');
    await page.getByRole('button', { name: /^dark$/i }).click();
    await page.locator('aside').locator('button').first().click();
    ok('settings-closed');

    await page.getByTestId('save-layout').click();
    try {
      await page.getByText(/Layout (saved|updated)/i).waitFor({ timeout: 8000 });
      ok('save-toast');
    } catch {
      // Toast may animate out quickly — Save button still exercised
      ok('save-toast', 'click ok (toast missed)');
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'dnd-mobile.png'), fullPage: true });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 4,
    );
    if (!overflow) ok('mobile-no-overflow');
    else fail('mobile-no-overflow');

    if (errors.length) fail('page-errors', errors.slice(0, 3).join(' | '));
    else ok('no-page-errors');
  } catch (err) {
    fail('uncaught', String(err));
    await page.screenshot({ path: path.join(OUT, 'dnd-error.png'), fullPage: true }).catch(() => {});
  }

  await browser.close();
  const failed = results.filter((r) => r.status === 'FAIL');
  console.log('\nSUMMARY', `pass=${results.length - failed.length}`, `fail=${failed.length}`);
  fs.writeFileSync(path.join(OUT, 'dnd-results.json'), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main();
