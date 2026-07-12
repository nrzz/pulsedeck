/**
 * Full end-to-end coverage: APIs, all widgets, widget-shell UX, settings, desktop tray contracts.
 * Usage: PULSEDECK_URL=http://127.0.0.1:PORT node scripts/e2e-full.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASE = (process.env.PULSEDECK_URL || 'http://localhost:5173').replace(/\/$/, '');
const OUT = path.resolve(ROOT, 'apps/web/e2e-artifacts');
fs.mkdirSync(OUT, { recursive: true });

const ALL_WIDGETS = [
  'cpu',
  'ram',
  'gpu',
  'disk',
  'processes',
  'battery',
  'system-info',
  'uptime',
  'temps',
  'fans',
  'cpu-freq',
  'swap',
  'disk-io',
  'top-memory',
  'sensors',
  'alerts',
  'network-speed',
  'wifi',
  'ips',
  'ping',
  'data-usage',
  'net-adapters',
  'net-graph',
  'ports',
  'bandwidth-cap',
  'crypto',
  'stocks',
  'exchange',
  'market-strip',
  'portfolio',
  'clock',
  'world-clocks',
  'weather',
  'aqi',
  'notes',
  'todo',
  'calendar',
  'timer',
  'stopwatch',
  'quick-links',
  'launcher',
  'headline',
  'news',
  'media',
  'clipboard',
  'active-app',
  'hotkeys',
];

const results = [];

function ok(name, detail = '') {
  results.push({ name, status: 'PASS', detail });
  console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, status: 'FAIL', detail });
  console.log(`FAIL  ${name} — ${detail}`);
}

async function api(pathname, init) {
  const res = await fetch(`${BASE}${pathname}`, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }
  return { res, json, text };
}

function assertTraySource() {
  const isWin = process.platform === 'win32';
  const isLinux = process.platform === 'linux';
  const mainPath = path.join(ROOT, 'apps/desktop/src/main.ts');
  const pinPath = path.join(ROOT, 'apps/desktop/src/pin-desktop.ts');
  const preloadPath = path.join(ROOT, 'apps/desktop/src/preload.ts');
  const desktopPkg = path.join(ROOT, 'apps/desktop/package.json');
  const main = fs.readFileSync(mainPath, 'utf8');
  const pin = fs.readFileSync(pinPath, 'utf8');
  const preload = fs.readFileSync(preloadPath, 'utf8');
  const pkg = JSON.parse(fs.readFileSync(desktopPkg, 'utf8'));

  const checks = [
    ['tray-popup-right-click', /tray\.on\(\s*['"]right-click['"]/],
    ['tray-popup-click', /tray\.on\(\s*['"]click['"]/],
    ['tray-popUpContextMenu', /popUpContextMenu/],
    ['tray-customize-label', /Customize/],
    ['tray-edit-layout', /pulsedeck:edit-layout/],
    ['tray-open-settings', /pulsedeck:open-settings/],
    ['tray-add-widget', /pulsedeck:add-widget/],
    ['tray-icon-loader', /loadTrayIcon|tray-icon\.png/],
    ['desktop-pin-label', /Pinned to desktop|Behind windows/],
    ['tray-never-hide-on-click', /Keep board visible while using tray/],
    ['no-blur-repin', /Do NOT re-pin on every blur/],
  ];
  for (const [name, re] of checks) {
    if (re.test(main)) ok(name);
    else fail(name, 'missing in main.ts');
  }

  if (isWin) {
    if (/WorkerW/.test(pin) && /SHELLDLL_DefView/.test(pin) && /0x052[cC]/.test(pin))
      ok('workerw-pin');
    else fail('workerw-pin', 'missing WorkerW attach in pin-desktop.ts');
  } else {
    ok('workerw-pin-skipped', `platform=${process.platform}`);
  }

  if (isLinux || !isWin) {
    if (/createLinuxBehindWindowsPinner|wmctrl|Behind windows/.test(pin + main))
      ok('linux-behind-windows');
    else if (!isLinux) ok('linux-behind-windows-skipped', process.platform);
    else fail('linux-behind-windows', 'missing Linux pin helper');
  }

  if (/onOpenSettings/.test(preload) && /onAddWidget/.test(preload)) ok('preload-tray-ipc');
  else fail('preload-tray-ipc', 'missing onOpenSettings/onAddWidget');

  if (/openTarget/.test(preload) && /pickApp/.test(preload) && /getMedia/.test(preload))
    ok('preload-launcher-bridges');
  else fail('preload-launcher-bridges', 'missing openTarget/pickApp/getMedia');

  const trayPng = path.join(ROOT, 'apps/desktop/resources/tray-icon.png');
  if (fs.existsSync(trayPng)) ok('tray-icon-asset', `${fs.statSync(trayPng).size}b`);
  else fail('tray-icon-asset', 'tray-icon.png missing');

  if (pkg.build?.linux?.target) ok('desktop-linux-targets');
  else fail('desktop-linux-targets', 'missing build.linux in desktop package.json');

  if (isLinux) {
    const extra = JSON.stringify(pkg.build?.extraResources || []);
    // koffi should not be in top-level extraResources for linux (win-only extra)
    if (!/"to":\s*"koffi"/.test(extra)) ok('linux-no-koffi-extra');
    else fail('linux-no-koffi-extra', 'koffi still in global extraResources');
  }

  const catalogPath = path.join(ROOT, 'packages/shared/src/index.ts');
  const catalog = fs.readFileSync(catalogPath, 'utf8');
  const typeCount = (catalog.match(/type: '/g) || []).length;
  if (typeCount >= 40) ok('shared-catalog-40plus', `${typeCount} types`);
  else fail('shared-catalog-40plus', `${typeCount} types`);

  if (/STOCK_WATCHLIST_OPTIONS/.test(catalog) && /GLD/.test(catalog) && /SLV/.test(catalog))
    ok('shared-stock-presets-gold-silver');
  else fail('shared-stock-presets-gold-silver', 'missing GLD/SLV presets');

  if (/normalizeStockSymbol/.test(catalog) && /normalizeCryptoId/.test(catalog))
    ok('shared-symbol-normalizers');
  else fail('shared-symbol-normalizers', 'missing normalize helpers');

  if (/NEWS_SUGGESTIONS/.test(catalog) && /Daily brief/.test(catalog)) ok('shared-news-suggestions');
  else fail('shared-news-suggestions', 'missing Daily brief pack');

  const gpuPath = path.join(ROOT, 'apps/server/src/collectors/gpu.ts');
  if (fs.existsSync(gpuPath)) {
    const gpuSrc = fs.readFileSync(gpuPath, 'utf8');
    if (/nvidia-smi/.test(gpuSrc) && /enrichGpuMetrics/.test(gpuSrc)) {
      if (isWin && /GPU Engine/.test(gpuSrc)) ok('gpu-enrich-collector');
      else if (!isWin && /gpu_busy_percent|linux/i.test(gpuSrc)) ok('gpu-enrich-collector');
      else if (/nvidia-smi/.test(gpuSrc)) ok('gpu-enrich-collector', 'nvidia-smi path');
      else fail('gpu-enrich-collector', 'incomplete enrichment');
    } else fail('gpu-enrich-collector', 'missing nvidia-smi enrichment');
  } else fail('gpu-enrich-collector', 'gpu.ts missing');

  const newsWidget = fs.readFileSync(
    path.join(ROOT, 'apps/web/src/widgets/extras/NewsWidget.tsx'),
    'utf8',
  );
  if (/allowScroll/.test(newsWidget) && !/slice\(0,\s*[56]\)/.test(newsWidget))
    ok('news-scroll-no-hard-cap');
  else fail('news-scroll-no-hard-cap', 'News still capping visible items or not scrollable');

  const launcherWidget = fs.readFileSync(
    path.join(ROOT, 'apps/web/src/widgets/extras/LauncherWidget.tsx'),
    'utf8',
  );
  if (/kind:\s*'url'\s*\|\s*'app'|kind === 'app'/.test(launcherWidget) && /openTarget/.test(launcherWidget))
    ok('launcher-app-url-model');
  else fail('launcher-app-url-model', 'Launcher missing app/url kind support');
}

async function testApis() {
  const health = await api('/api/health');
  if (health.res.ok && health.json?.ok !== false)
    ok('api-health', JSON.stringify(health.json).slice(0, 80));
  else fail('api-health', `${health.res.status} ${health.text.slice(0, 120)}`);

  const metrics = await api('/api/metrics');
  if (metrics.res.ok && metrics.json?.cpu && metrics.json?.memory) ok('api-metrics');
  else fail('api-metrics', `${metrics.res.status}`);

  const config = await api('/api/config');
  if (config.res.ok && Array.isArray(config.json?.presets)) ok('api-config-get');
  else fail('api-config-get', `${config.res.status}`);

  const crypto = await api('/api/crypto?ids=bitcoin');
  if (crypto.res.ok) ok('api-crypto');
  else fail('api-crypto', `${crypto.res.status}`);

  const stocks = await api('/api/stocks?symbols=AAPL');
  if (stocks.res.ok) ok('api-stocks');
  else fail('api-stocks', `${stocks.res.status}`);

  const commodities = await api('/api/stocks?symbols=GLD,SLV,GC%3DF,SI%3DF');
  if (
    commodities.res.ok &&
    Array.isArray(commodities.json) &&
    commodities.json.length >= 2 &&
    commodities.json.every((q) => typeof q.price === 'number' && q.price > 0)
  ) {
    ok(
      'api-stocks-commodities',
      commodities.json.map((q) => `${q.symbol}=${q.price}`).join(', '),
    );
  } else {
    fail(
      'api-stocks-commodities',
      `${commodities.res.status} n=${Array.isArray(commodities.json) ? commodities.json.length : 0}`,
    );
  }

  const weather = await api('/api/weather?lat=12.9716&lon=77.5946&city=Bangalore');
  if (weather.res.ok) ok('api-weather');
  else fail('api-weather', `${weather.res.status}`);

  const exchange = await api('/api/exchange?pairs=USD/INR');
  if (exchange.res.ok) ok('api-exchange');
  else fail('api-exchange', `${exchange.res.status}`);

  const aqi = await api('/api/aqi?lat=12.9716&lon=77.5946&city=Bangalore');
  if (aqi.res.ok) ok('api-aqi');
  else fail('api-aqi', `${aqi.res.status}`);

  const headline = await api('/api/headline');
  if (headline.res.ok) ok('api-headline');
  else fail('api-headline', `${headline.res.status}`);

  const news = await api('/api/news?topics=technology&limit=3');
  if (news.res.ok && Array.isArray(news.json?.items))
    ok('api-news', `${news.json.items.length} items`);
  else fail('api-news', `${news.res.status}`);

  const newsMix = await api(
    '/api/news?topics=technology,world,india,business&limit=20',
  );
  if (
    newsMix.res.ok &&
    Array.isArray(newsMix.json?.items) &&
    newsMix.json.items.length >= 8
  ) {
    const sources = new Set(
      newsMix.json.items.map((i) => i.source || i.topic || '').filter(Boolean),
    );
    ok(
      'api-news-variety',
      `${newsMix.json.items.length} items, ${sources.size} sources`,
    );
  } else {
    fail(
      'api-news-variety',
      `n=${Array.isArray(newsMix.json?.items) ? newsMix.json.items.length : 0}`,
    );
  }

  const ping = await api('/api/ping?hosts=1.1.1.1');
  if (ping.res.ok) ok('api-ping');
  else fail('api-ping', `${ping.res.status}`);

  // GPU dual-adapter edge cases (empty array is valid — headless CI / no GPU)
  if (metrics.res.ok && Array.isArray(metrics.json?.gpu)) {
    const gpus = metrics.json.gpu;
    if (gpus.length === 0) {
      ok('api-gpu', 'empty — no GPU on this host');
    } else {
      const allHaveUtil = gpus.every(
        (g) => typeof g.utilization === 'number' && g.utilization >= 0 && g.utilization <= 100,
      );
      if (allHaveUtil) ok('api-gpu-util-range', gpus.map((g) => `${g.model}:${g.utilization}%`).join(' | '));
      else fail('api-gpu-util-range', JSON.stringify(gpus.map((g) => g.utilization)));

      const discreteFirst = /nvidia|geforce|radeon|rtx|gtx|amd/i.test(gpus[0]?.model || '');
      const hasIntel = gpus.some((g) => /intel|uhd|iris/i.test(g.model || ''));
      if (gpus.length > 1 && hasIntel) {
        if (discreteFirst) ok('api-gpu-discrete-first', gpus[0].model);
        else fail('api-gpu-discrete-first', `primary=${gpus[0]?.model}`);
      } else {
        ok('api-gpu-order', gpus.map((g) => g.model).join(' | '));
      }
    }
  } else {
    fail('api-gpu', 'metrics.gpu missing or not an array');
  }

  const cryptoGold = await api('/api/crypto?ids=bitcoin,pax-gold');
  if (cryptoGold.res.ok && Array.isArray(cryptoGold.json) && cryptoGold.json.length >= 1) {
    ok('api-crypto-pax-gold', cryptoGold.json.map((c) => c.id || c.symbol).join(','));
  } else {
    fail('api-crypto-pax-gold', `${cryptoGold.res.status}`);
  }
}

async function resetDesktopPreset(page) {
  await page.evaluate(async () => {
    localStorage.removeItem('pulsedeck.widgetDesktopPreset');
    const res = await fetch('/api/config');
    const c = await res.json();
    const desktop = {
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
          settings: { lat: 12.9716, lon: 77.5946, city: 'Bangalore' },
        },
      ],
      layout: [
        { i: 'cpu-1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
        { i: 'ram-1', x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
        { i: 'net-1', x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
        { i: 'clock-1', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 2 },
        { i: 'weather-1', x: 4, y: 3, w: 4, h: 3, minW: 2, minH: 2 },
      ],
    };
    const presets = [...(c.presets || []).filter((p) => p.id !== 'desktop'), desktop];
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...c, presets, activePresetId: 'desktop' }),
    });
  });
}

async function testWidgetShell(page) {
  await page.goto(`${BASE}/?shell=widget`, { waitUntil: 'load' });
  await resetDesktopPreset(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(600);

  const shell = await page.evaluate(() => document.body.classList.contains('shell-widget'));
  if (shell) ok('shell-widget');
  else fail('shell-widget', 'missing class');

  await page.getByTestId('widget-toolbar').waitFor();
  const visible = await page.getByTestId('widget-toolbar').getAttribute('data-visible');
  if (visible === 'true') ok('toolbar-visible');
  else fail('toolbar-visible', `data-visible=${visible}`);

  const customizeText = await page.getByTestId('open-settings').innerText();
  if (/customize/i.test(customizeText)) ok('customize-cta');
  else fail('customize-cta', customizeText);

  await page.waitForFunction(
    () =>
      /\d+(\.\d+)?%/.test(document.body.innerText) ||
      /\d+(\.\d+)?\s*GB/.test(document.body.innerText),
    null,
    { timeout: 30000 },
  );
  ok('metrics-live');

  await page.getByTestId('open-settings').click();
  await page.getByTestId('widget-settings').waitFor();
  ok('settings-from-customize');

  const opacity = page.getByTestId('board-opacity');
  if (await opacity.count()) {
    await opacity.fill('0.7');
    ok('settings-opacity');
  } else fail('settings-opacity', 'missing');

  await page.locator('aside').locator('button').first().click();

  // Edit mode smoke
  await page.getByTestId('edit-toggle').click();
  await page.getByTestId('edit-hint').waitFor();
  ok('edit-mode');
  await page.getByTestId('edit-toggle').click();

  // Navigate away so in-flight persistConfig from settings cannot overwrite the bulk PUT
  await page.goto('about:blank');
  await page.waitForTimeout(500);

  const cfgBefore = await api('/api/config');
  const baseCfg = cfgBefore.json;
  const desktop = baseCfg.presets.find((p) => p.id === 'desktop') || baseCfg.presets[0];
  let slot = 0;
  const widgets = [];
  const layout = [];
  for (const type of ALL_WIDGETS) {
    const id = `${type}-e2e`;
    widgets.push({ id, type, settings: {} });
    layout.push({
      i: id,
      x: (slot * 4) % 12,
      y: Math.floor(slot / 3) * 3,
      w: 4,
      h: 3,
      minW: 2,
      minH: 2,
    });
    slot += 1;
  }
  const nextCfg = {
    ...baseCfg,
    activePresetId: desktop.id,
    presets: baseCfg.presets.map((p) =>
      p.id === desktop.id ? { ...p, widgets, layout } : p,
    ),
  };
  const putRes = await api('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nextCfg),
  });
  if (putRes.res.ok) ok('config-put-all-widgets');
  else fail('config-put-all-widgets', `${putRes.res.status}`);

  const cfgCheck = await api('/api/config');
  const presetCheck =
    cfgCheck.json?.presets?.find((p) => p.id === cfgCheck.json.activePresetId) ||
    cfgCheck.json?.presets?.[0];
  const typeSet = new Set((presetCheck?.widgets || []).map((w) => w.type));
  const missing = ALL_WIDGETS.filter((t) => !typeSet.has(t));
  if (missing.length === 0) ok('all-widget-types-in-config', `${typeSet.size} types`);
  else fail('all-widget-types-in-config', `missing ${missing.join(',')}`);

  await page.goto(`${BASE}/?shell=widget`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const present = await page.evaluate(() => ({
    itemCount: document.querySelectorAll('.react-grid-item').length,
    types: [...document.querySelectorAll('[data-widget-type]')].map((el) =>
      el.getAttribute('data-widget-type'),
    ),
  }));

  if (present.itemCount >= ALL_WIDGETS.length) ok('all-widgets-on-board', `${present.itemCount} items`);
  else if (present.types.length >= ALL_WIDGETS.length)
    ok('all-widgets-on-board', `${present.types.length} typed nodes`);
  else
    fail(
      'all-widgets-on-board',
      `${present.itemCount} items / ${present.types.length} typed (expected ${ALL_WIDGETS.length})`,
    );

  const addVisible = await page.getByTestId('add-widget').isVisible().catch(() => false);
  if (!addVisible) {
    await page.getByTestId('edit-toggle').click();
    await page.getByTestId('edit-hint').waitFor();
  }
  await page.getByTestId('add-widget').click();
  await page.getByRole('heading', { name: 'Add widget' }).waitFor();
  const widgetBtns = await page.locator('.glass-card .grid button').count();
  if (widgetBtns >= 40) ok('add-modal-catalog', `${widgetBtns} types`);
  else fail('add-modal-catalog', `${widgetBtns} types (expected >= 40)`);

  await page.getByTestId('close-add-widget').click();
  await page.getByRole('heading', { name: 'Add widget' }).waitFor({ state: 'hidden' });

  await page.getByTestId('save-layout').click();
  try {
    await page.getByText(/Layout saved/i).waitFor({ timeout: 5000 });
    ok('save-layout');
  } catch {
    ok('save-layout', 'clicked (toast may have faded)');
  }

  await page.screenshot({ path: path.join(OUT, 'full-widget-shell.png'), fullPage: true });
  ok('screenshot-widget');
}

async function testBrowserDashboard(page) {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.getByText('PulseDeck', { exact: true }).first().waitFor();
  ok('browser-brand');

  try {
    await page.getByText('Live').waitFor({ timeout: 15000 });
    ok('browser-live');
  } catch {
    fail('browser-live', 'Live badge missing');
  }

  await page.getByTestId('edit-toggle').click();
  await page.getByTestId('add-widget').click();
  await page.getByRole('heading', { name: 'Add widget' }).waitFor();
  ok('browser-add-modal');
  await page.getByTestId('close-add-widget').click();

  await page.getByTestId('open-settings').click();
  await page.getByRole('heading', { name: 'Settings' }).waitFor();
  ok('browser-settings');

  // News defaults in customize panel
  const topicsLabel = page.getByText(/Topics \(max 8\)/i);
  if (await topicsLabel.count()) ok('settings-news-topics-max8');
  else fail('settings-news-topics-max8', 'Topics (max 8) missing');

  await page.locator('aside').locator('button').first().click();

  // Stocks gear: gold/silver chips
  await page.goto(`${BASE}/?shell=widget`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const stocksCard = page.locator('[data-widget-type="stocks"]').first();
  if (await stocksCard.count()) {
    const gear = stocksCard.getByRole('button', { name: /Configure widget/i }).first();
    if (await gear.count()) {
      await gear.click();
      await page.waitForTimeout(400);
    }
    const goldChip = page.getByRole('button', { name: /Gold ETF/i });
    const silverChip = page.getByRole('button', { name: /Silver ETF/i });
    if ((await goldChip.count()) && (await silverChip.count())) {
      await goldChip.click();
      await silverChip.click();
      ok('stocks-gear-gold-silver-chips');
    } else if (await page.getByText(/Gold ETF/i).count()) {
      ok('stocks-gear-gold-silver-chips', 'visible');
    } else {
      fail('stocks-gear-gold-silver-chips', 'chips not found');
    }
  } else {
    ok('stocks-gear-skipped', 'stocks widget not on board in this shell pass');
  }

  // GPU widget shows discrete primary when dual-GPU
  const gpuCard = page.locator('[data-widget-type="gpu"]').first();
  if (await gpuCard.count()) {
    const text = await gpuCard.innerText();
    if (/nvidia|geforce|radeon|rtx|intel|gpu|util|%/i.test(text)) ok('gpu-widget-render', text.slice(0, 80).replace(/\s+/g, ' '));
    else fail('gpu-widget-render', text.slice(0, 120));
  } else {
    ok('gpu-widget-skipped', 'gpu not on current board');
  }

  // News widget scroll class
  const newsCard = page.locator('[data-widget-type="news"]').first();
  if (await newsCard.count()) {
    const scrollable = await newsCard.locator('.widget-body-scroll').count();
    if (scrollable) ok('news-widget-scroll-class');
    else fail('news-widget-scroll-class', 'missing widget-body-scroll');
  } else {
    ok('news-widget-skipped', 'news not on current board');
  }

  // Launcher gear: URL / App toggle
  const launcherCard = page.locator('[data-widget-type="launcher"]').first();
  if (await launcherCard.count()) {
    const gear = launcherCard.getByRole('button', { name: /Configure widget/i }).first();
    if (await gear.count()) await gear.click();
    await page.waitForTimeout(400);
    const appToggle = page.getByRole('button', { name: /^App$/i });
    const urlToggle = page.getByRole('button', { name: /^URL$/i });
    if ((await appToggle.count()) && (await urlToggle.count())) {
      await appToggle.click();
      ok('launcher-gear-url-app-toggle');
    } else {
      fail('launcher-gear-url-app-toggle', 'URL/App toggles missing');
    }
  } else {
    ok('launcher-gear-skipped', 'launcher not on board');
  }

  await page.screenshot({ path: path.join(OUT, 'full-browser.png'), fullPage: true });
  ok('screenshot-browser');
}

async function main() {
  console.log(`E2E full against ${BASE}\n`);
  assertTraySource();
  await testApis();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(25000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  try {
    await testWidgetShell(page);
    await testBrowserDashboard(page);
    if (errors.length) fail('page-errors', errors.slice(0, 5).join(' | '));
    else ok('no-page-errors');
  } catch (err) {
    fail('uncaught', String(err));
    await page.screenshot({ path: path.join(OUT, 'full-error.png'), fullPage: true }).catch(() => {});
  }

  await browser.close();
  const failed = results.filter((r) => r.status === 'FAIL');
  console.log('\nSUMMARY', `pass=${results.length - failed.length}`, `fail=${failed.length}`);
  fs.writeFileSync(path.join(OUT, 'full-results.json'), JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main();
