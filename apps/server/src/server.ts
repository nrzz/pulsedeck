import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import si from 'systeminformation';
import type { AppConfig, WsMessage } from '@pulsedeck/shared';
import { loadConfig, saveConfig, setDataDir } from './config.js';
import { collectMetrics, setActiveWidgetTypes } from './collectors/metrics.js';
import { pingHosts } from './collectors/ping.js';
import { fetchCrypto, fetchStocks, fetchWeather, fetchExchange, fetchAqi, fetchHeadline, fetchNews } from './collectors/external.js';
import { WsHub } from './ws-hub.js';

/** Safe in ESM and in the Electron CJS server bundle (import.meta.url is empty there). */
function resolveServerDir(): string {
  try {
    const metaUrl = import.meta.url as string | undefined;
    if (typeof metaUrl === 'string' && metaUrl.length > 0) {
      return path.dirname(fileURLToPath(metaUrl));
    }
  } catch {
    // ignore
  }
  return process.cwd();
}

export interface StartServerOptions {
  port?: number;
  host?: string;
  dataDir?: string;
  webDistPath?: string;
  quiet?: boolean;
}

export interface StartedServer {
  app: FastifyInstance;
  port: number;
  host: string;
  url: string;
  close: () => Promise<void>;
}

export async function startServer(options: StartServerOptions = {}): Promise<StartedServer> {
  const host = options.host ?? process.env.HOST ?? '127.0.0.1';
  const port = options.port ?? (Number(process.env.PORT) || 8787);
  const quiet = options.quiet ?? false;

  if (options.dataDir) {
    setDataDir(options.dataDir);
  } else if (process.env.PULSEDECK_DATA_DIR) {
    setDataDir(process.env.PULSEDECK_DATA_DIR);
  }

  const hub = new WsHub();
  let config = loadConfig();
  const timers: ReturnType<typeof setInterval>[] = [];

  function getActiveWidgets() {
    const preset = config.presets.find((p) => p.id === config.activePresetId) ?? config.presets[0];
    return preset?.widgets ?? [];
  }

  function syncDemandGates() {
    setActiveWidgetTypes(getActiveWidgets().map((w) => w.type));
  }

  syncDemandGates();

  function extractSettings<T extends Record<string, unknown>>(type: string): T[] {
    return getActiveWidgets()
      .filter((w) => w.type === type)
      .map((w) => w.settings as T);
  }

  async function broadcastMetrics() {
    try {
      const metrics = await collectMetrics();
      hub.broadcast({ type: 'metrics', payload: metrics });
    } catch (err) {
      console.error('[metrics]', err);
    }
  }

  async function broadcastPing() {
    const pingWidgets = extractSettings<{ hosts?: string[] }>('ping');
    const hosts = [
      ...new Set(pingWidgets.flatMap((s) => s.hosts ?? ['1.1.1.1', '8.8.8.8', 'google.com'])),
    ];
    if (!hosts.length) return;
    try {
      const results = await pingHosts(hosts);
      hub.broadcast({ type: 'ping', payload: results });
    } catch (err) {
      console.error('[ping]', err);
    }
  }

  async function broadcastCrypto() {
    const cryptoWidgets = extractSettings<{ symbols?: string[] }>('crypto');
    const portfolio = extractSettings<{ holdings?: Array<{ symbol: string; kind: string }> }>(
      'portfolio',
    );
    const fromPortfolio = portfolio.flatMap((s) =>
      (s.holdings ?? []).filter((h) => h.kind === 'crypto').map((h) => h.symbol.toLowerCase()),
    );
    const ids = [
      ...new Set([
        ...cryptoWidgets.flatMap((s) => s.symbols ?? ['bitcoin', 'ethereum']),
        ...fromPortfolio,
      ]),
    ];
    if (
      !ids.length &&
      !getActiveWidgets().some((w) => w.type === 'crypto' || w.type === 'portfolio')
    ) {
      return;
    }
    try {
      const quotes = await fetchCrypto(ids.length ? ids : ['bitcoin', 'ethereum']);
      hub.broadcast({ type: 'crypto', payload: quotes });
    } catch (err) {
      console.error('[crypto]', err);
    }
  }

  async function broadcastStocks() {
    const stockWidgets = extractSettings<{ symbols?: string[] }>('stocks');
    const portfolio = extractSettings<{ holdings?: Array<{ symbol: string; kind: string }> }>(
      'portfolio',
    );
    const fromPortfolio = portfolio.flatMap((s) =>
      (s.holdings ?? []).filter((h) => h.kind === 'stock').map((h) => h.symbol),
    );
    const symbols = [
      ...new Set([
        ...stockWidgets.flatMap((s) => s.symbols ?? ['AAPL', 'MSFT', 'GOOGL']),
        ...fromPortfolio,
      ]),
    ];
    if (
      !symbols.length &&
      !getActiveWidgets().some((w) => w.type === 'stocks' || w.type === 'portfolio')
    ) {
      return;
    }
    try {
      const quotes = await fetchStocks(
        symbols.length ? symbols : ['AAPL', 'MSFT'],
        config.apiKeys.finnhub,
      );
      hub.broadcast({ type: 'stocks', payload: quotes });
    } catch (err) {
      console.error('[stocks]', err);
    }
  }

  async function broadcastWeather() {
    const weatherWidgets = extractSettings<{ lat?: number; lon?: number; city?: string }>(
      'weather',
    );
    if (!weatherWidgets.length) return;
    const w = weatherWidgets[0];
    const lat = w.lat ?? 12.9716;
    const lon = w.lon ?? 77.5946;
    try {
      const data = await fetchWeather(lat, lon, w.city);
      if (data) hub.broadcast({ type: 'weather', payload: data });
    } catch (err) {
      console.error('[weather]', err);
    }
  }

  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });
  await app.register(websocket);

  app.get('/api/health', async () => ({
    ok: true,
    name: 'PulseDeck',
    clients: hub.size,
  }));

  app.get('/api/config', async () => config);

  app.put<{ Body: AppConfig }>('/api/config', async (req) => {
    config = { ...req.body, version: req.body.version ?? 1 };
    saveConfig(config);
    syncDemandGates();
    hub.broadcast({ type: 'config', payload: config });
    return config;
  });

  app.patch<{ Body: Partial<AppConfig> }>('/api/config', async (req) => {
    config = {
      ...config,
      ...req.body,
      theme: { ...config.theme, ...req.body.theme },
      apiKeys: { ...config.apiKeys, ...req.body.apiKeys },
      shell: req.body.shell ? { ...config.shell, ...req.body.shell } : config.shell,
    };
    saveConfig(config);
    syncDemandGates();
    hub.broadcast({ type: 'config', payload: config });
    return config;
  });

  app.get('/api/crypto', async (req) => {
    const q = req.query as { ids?: string };
    const ids = (q.ids || 'bitcoin,ethereum,solana').split(',').map((s) => s.trim());
    return fetchCrypto(ids);
  });

  app.get('/api/stocks', async (req) => {
    const q = req.query as { symbols?: string };
    const symbols = (q.symbols || 'AAPL,MSFT,GOOGL').split(',').map((s) => s.trim());
    return fetchStocks(symbols, config.apiKeys.finnhub);
  });

  app.get('/api/weather', async (req) => {
    const q = req.query as { lat?: string; lon?: string; city?: string };
    const lat = Number(q.lat ?? 12.9716);
    const lon = Number(q.lon ?? 77.5946);
    return fetchWeather(lat, lon, q.city);
  });

  app.get('/api/exchange', async (req) => {
    const q = req.query as { pairs?: string };
    const pairs = (q.pairs || 'USD/INR,EUR/INR').split(',').map((s) => s.trim());
    return fetchExchange(pairs);
  });

  app.get('/api/aqi', async (req) => {
    const q = req.query as { lat?: string; lon?: string; city?: string };
    const lat = Number(q.lat ?? 12.9716);
    const lon = Number(q.lon ?? 77.5946);
    return fetchAqi(lat, lon, q.city);
  });

  app.get('/api/headline', async (req) => {
    const q = req.query as { url?: string };
    const url = q.url || 'https://news.ycombinator.com/rss';
    return fetchHeadline(url);
  });

  app.get('/api/news', async (req) => {
    const q = req.query as { topics?: string; feeds?: string; limit?: string };
    const topics = (q.topics || 'technology,world,india,business')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const feeds = (q.feeds || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const limit = Number(q.limit) || 20;
    return fetchNews({ topics, feeds, limit });
  });

  app.get('/api/ping', async (req) => {
    const q = req.query as { hosts?: string };
    const hosts = (q.hosts || '1.1.1.1,8.8.8.8').split(',').map((s) => s.trim());
    return pingHosts(hosts);
  });

  app.get('/api/metrics', async () => collectMetrics());

  app.register(async (fastify) => {
    fastify.get('/ws', { websocket: true }, (socket) => {
      hub.add(socket);
      hub.send(socket, { type: 'config', payload: config });

      socket.on('message', async (raw) => {
        try {
          const msg = JSON.parse(String(raw)) as WsMessage;
          if (msg.type === 'subscribe') {
            await broadcastMetrics();
            void broadcastCrypto();
            void broadcastStocks();
            void broadcastWeather();
            void broadcastPing();
          }
        } catch {
          hub.send(socket, { type: 'error', payload: 'Invalid message' });
        }
      });
    });
  });

  const here = resolveServerDir();
  const webDistCandidates = [
    options.webDistPath,
    process.env.PULSEDECK_WEB_DIST,
    path.resolve(process.cwd(), 'apps', 'web', 'dist'),
    // npm start -w @pulsedeck/server runs with cwd=apps/server
    path.resolve(process.cwd(), '..', 'web', 'dist'),
    // relative to this file: apps/server/dist → apps/web/dist
    path.resolve(here, '..', '..', 'web', 'dist'),
  ].filter((p): p is string => Boolean(p));

  const webDist = webDistCandidates.find((p) => fs.existsSync(path.join(p, 'index.html')));

  if (webDist) {
    await app.register(fastifyStatic, { root: webDist });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api') || req.url.startsWith('/ws')) {
        return reply.status(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  } else if (!quiet) {
    console.warn(
      '[pulsedeck] Web UI dist not found. Tried:\n  ' + webDistCandidates.join('\n  '),
    );
  }

  hub.startHeartbeat();

  // 5s keeps vitals fresh without thrashing systeminformation / UI re-renders
  timers.push(setInterval(broadcastMetrics, 5000));
  timers.push(setInterval(broadcastPing, 10000));
  timers.push(setInterval(broadcastCrypto, 60000));
  timers.push(setInterval(broadcastStocks, 60000));
  timers.push(setInterval(broadcastWeather, 15 * 60 * 1000));

  setTimeout(() => {
    void broadcastMetrics();
    void broadcastPing();
    void broadcastCrypto();
    void broadcastStocks();
    void broadcastWeather();
  }, 1000);

  void (async () => {
    try {
      await si.currentLoad();
      await new Promise((r) => setTimeout(r, 600));
      await collectMetrics();
      await broadcastCrypto();
      await broadcastStocks();
      await broadcastWeather();
      await broadcastPing();
    } catch {
      // ignore warmup errors
    }
  })();

  await app.listen({ port, host });
  const url = `http://${host}:${port}`;

  if (!quiet) {
    console.log(`\n  PulseDeck server ready`);
    console.log(`  → ${url}`);
    console.log(`  → ws://${host}:${port}/ws\n`);
  }

  return {
    app,
    port,
    host,
    url,
    close: async () => {
      for (const t of timers) clearInterval(t);
      await app.close();
    },
  };
}
