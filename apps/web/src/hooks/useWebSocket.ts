import { useEffect, useRef } from 'react';
import type {
  AppConfig,
  CryptoQuote,
  PingResult,
  StockQuote,
  SystemMetrics,
  WeatherData,
  WsMessage,
} from '@pulsedeck/shared';
import { createDesktopPreset } from '@pulsedeck/shared';
import { useDashboard } from '../store/dashboard';
import { isWidgetShell } from '../lib/shell';

const DESKTOP_PRESET_FLAG = 'pulsedeck.widgetDesktopPreset';

function migrateWidgetDesktopPreset(config: AppConfig): { config: AppConfig; changed: boolean } {
  if (!isWidgetShell()) return { config, changed: false };

  let presets = config.presets ?? [];
  let changed = false;
  if (!presets.some((p) => p.id === 'desktop')) {
    presets = [...presets, createDesktopPreset()];
    changed = true;
  }

  const already =
    typeof localStorage !== 'undefined' && localStorage.getItem(DESKTOP_PRESET_FLAG) === '1';
  if (!already && config.activePresetId === 'default') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(DESKTOP_PRESET_FLAG, '1');
    return { config: { ...config, presets, activePresetId: 'desktop' }, changed: true };
  }

  if (typeof localStorage !== 'undefined' && !already) {
    localStorage.setItem(DESKTOP_PRESET_FLAG, '1');
  }

  if (changed) return { config: { ...config, presets }, changed: true };
  return { config, changed: false };
}

function wsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

async function bootstrapExternal(config: AppConfig) {
  const preset = config.presets.find((p) => p.id === config.activePresetId) ?? config.presets[0];
  const widgets = preset?.widgets ?? [];

  const cryptoIds = [
    ...new Set(
      widgets
        .filter((w) => w.type === 'crypto')
        .flatMap((w) => (w.settings.symbols as string[]) || ['bitcoin', 'ethereum']),
    ),
  ];
  const stockSymbols = [
    ...new Set(
      widgets
        .filter((w) => w.type === 'stocks')
        .flatMap((w) => (w.settings.symbols as string[]) || ['AAPL', 'MSFT']),
    ),
  ];
  const weatherCfg = widgets.find((w) => w.type === 'weather')?.settings as
    { lat?: number; lon?: number; city?: string } | undefined;
  const pingHosts = [
    ...new Set(
      widgets
        .filter((w) => w.type === 'ping')
        .flatMap((w) => (w.settings.hosts as string[]) || ['1.1.1.1', '8.8.8.8']),
    ),
  ];

  const tasks: Promise<void>[] = [];

  if (cryptoIds.length || widgets.some((w) => w.type === 'crypto')) {
    const ids = (cryptoIds.length ? cryptoIds : ['bitcoin', 'ethereum', 'solana']).join(',');
    tasks.push(
      fetch(`/api/crypto?ids=${encodeURIComponent(ids)}`)
        .then((r) => r.json())
        .then((data: CryptoQuote[]) => {
          if (Array.isArray(data) && data.length) useDashboard.getState().setCrypto(data);
        })
        .catch(() => undefined),
    );
  }

  if (stockSymbols.length || widgets.some((w) => w.type === 'stocks')) {
    const symbols = (stockSymbols.length ? stockSymbols : ['AAPL', 'MSFT']).join(',');
    tasks.push(
      fetch(`/api/stocks?symbols=${encodeURIComponent(symbols)}`)
        .then((r) => r.json())
        .then((data: StockQuote[]) => {
          if (Array.isArray(data) && data.length) useDashboard.getState().setStocks(data);
        })
        .catch(() => undefined),
    );
  }

  if (weatherCfg || widgets.some((w) => w.type === 'weather')) {
    const lat = weatherCfg?.lat ?? 28.6139;
    const lon = weatherCfg?.lon ?? 77.209;
    const city = weatherCfg?.city ?? 'New Delhi';
    tasks.push(
      fetch(`/api/weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`)
        .then((r) => r.json())
        .then((data: WeatherData) => {
          if (data && data.temperature != null) useDashboard.getState().setWeather(data);
        })
        .catch(() => undefined),
    );
  }

  if (pingHosts.length || widgets.some((w) => w.type === 'ping')) {
    const hosts = (pingHosts.length ? pingHosts : ['1.1.1.1', '8.8.8.8']).join(',');
    tasks.push(
      fetch(`/api/ping?hosts=${encodeURIComponent(hosts)}`)
        .then((r) => r.json())
        .then((data: PingResult[]) => {
          if (Array.isArray(data) && data.length) useDashboard.getState().setPing(data);
        })
        .catch(() => undefined),
    );
  }

  await Promise.all(tasks);
}

export function useWebSocket() {
  const setConnected = useDashboard((s) => s.setConnected);
  const setConfig = useDashboard((s) => s.setConfig);
  const setMetrics = useDashboard((s) => s.setMetrics);
  const setPing = useDashboard((s) => s.setPing);
  const setCrypto = useDashboard((s) => s.setCrypto);
  const setStocks = useDashboard((s) => s.setStocks);
  const setWeather = useDashboard((s) => s.setWeather);
  const applyTheme = useDashboard((s) => s.applyTheme);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    let closed = false;

    const connect = () => {
      if (closed) return;
      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0;
        setConnected(true);
        ws.send(JSON.stringify({ type: 'subscribe', payload: {} }));
        // REST hydrate external widgets immediately
        const cfg = useDashboard.getState().config;
        void bootstrapExternal(cfg);
      };

      ws.onclose = () => {
        setConnected(false);
        const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
        retryRef.current += 1;
        setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as WsMessage;
          switch (msg.type) {
            case 'metrics':
              setMetrics(msg.payload as SystemMetrics);
              break;
            case 'ping':
              setPing(msg.payload as PingResult[]);
              break;
            case 'crypto':
              setCrypto(msg.payload as CryptoQuote[]);
              break;
            case 'stocks':
              setStocks(msg.payload as StockQuote[]);
              break;
            case 'weather':
              setWeather(msg.payload as WeatherData);
              break;
            case 'config': {
              const { config: next, changed } = migrateWidgetDesktopPreset(
                msg.payload as AppConfig,
              );
              setConfig(next);
              applyTheme();
              void bootstrapExternal(next);
              if (changed) void persistConfig(next).catch(() => undefined);
              break;
            }
            default:
              break;
          }
        } catch {
          // ignore malformed
        }
      };
    };

    fetch('/api/config')
      .then((r) => r.json())
      .then((c: AppConfig) => {
        const { config: next, changed } = migrateWidgetDesktopPreset(c);
        setConfig(next);
        applyTheme();
        void bootstrapExternal(next);
        if (changed) void persistConfig(next).catch(() => undefined);
      })
      .catch(() => undefined);

    connect();

    return () => {
      closed = true;
      wsRef.current?.close();
    };
  }, [setConnected, setConfig, setMetrics, setPing, setCrypto, setStocks, setWeather, applyTheme]);
}

export async function persistConfig(config: AppConfig): Promise<AppConfig> {
  const res = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to save config');
  return res.json();
}
