import { create } from 'zustand';
import type {
  AppConfig,
  CryptoQuote,
  LayoutItem,
  NewsItem,
  PingResult,
  StockQuote,
  SystemMetrics,
  WeatherData,
  WidgetInstance,
} from '@pulsedeck/shared';
import { createDefaultConfig } from '@pulsedeck/shared';
import { hexToRgb } from '../lib/utils';

export interface ExchangeRate {
  pair: string;
  rate: number;
}

export interface HeadlineData {
  title: string;
  link?: string;
}

export interface AqiData {
  value: number;
  city?: string;
}

interface DashboardState {
  connected: boolean;
  config: AppConfig;
  metrics: SystemMetrics | null;
  ping: PingResult[];
  crypto: CryptoQuote[];
  stocks: StockQuote[];
  weather: WeatherData | null;
  exchange: ExchangeRate[] | null;
  headline: HeadlineData | null;
  aqi: AqiData | null;
  /** Per-widget news trays — pruned on remove to keep memory tiny */
  newsByWidgetId: Record<string, NewsItem[]>;
  editMode: boolean;
  settingsOpen: boolean;
  addWidgetOpen: boolean;
  history: {
    cpu: { t: number; v: number }[];
    ram: { t: number; v: number }[];
    netRx: { t: number; v: number }[];
    netTx: { t: number; v: number }[];
  };
  setConnected: (v: boolean) => void;
  setConfig: (c: AppConfig) => void;
  setMetrics: (m: SystemMetrics) => void;
  setPing: (p: PingResult[]) => void;
  setCrypto: (c: CryptoQuote[]) => void;
  setStocks: (s: StockQuote[]) => void;
  setWeather: (w: WeatherData | null) => void;
  setExchange: (rates: ExchangeRate[] | null) => void;
  setHeadline: (headline: HeadlineData | null) => void;
  setAqi: (aqi: AqiData | null) => void;
  setNewsForWidget: (id: string, items: NewsItem[]) => void;
  setEditMode: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setAddWidgetOpen: (v: boolean) => void;
  updateLayout: (layout: LayoutItem[]) => void;
  updateWidgetSettings: (id: string, settings: Record<string, unknown>) => void;
  removeWidget: (id: string) => void;
  addWidget: (widget: WidgetInstance, layoutItem: LayoutItem) => void;
  applyTheme: () => void;
  getActivePreset: () => AppConfig['presets'][0];
}

/** Keep sparkline history short — major RAM win vs longer rings */
const HISTORY_LEN = 12;

function pushHistory<T extends { t: number }>(arr: T[], item: T): T[] {
  const next = [...arr, item];
  return next.length > HISTORY_LEN ? next.slice(next.length - HISTORY_LEN) : next;
}

export const useDashboard = create<DashboardState>((set, get) => ({
  connected: false,
  config: createDefaultConfig(),
  metrics: null,
  ping: [],
  crypto: [],
  stocks: [],
  weather: null,
  exchange: null,
  headline: null,
  aqi: null,
  newsByWidgetId: {},
  editMode: false,
  settingsOpen: false,
  addWidgetOpen: false,
  history: { cpu: [], ram: [], netRx: [], netTx: [] },

  setConnected: (connected) => set({ connected }),
  setConfig: (config) => {
    const defaults = createDefaultConfig();
    const next = {
      ...defaults,
      ...config,
      theme: { ...defaults.theme, ...config.theme },
      shell: { ...defaults.shell, ...(config.shell ?? {}) },
      apiKeys: { ...defaults.apiKeys, ...config.apiKeys },
    };
    const active = next.presets.find((p) => p.id === next.activePresetId) ?? next.presets[0];
    const liveIds = new Set((active?.widgets ?? []).map((w) => w.id));
    set((state) => {
      const prunedNews: Record<string, NewsItem[]> = {};
      for (const [id, items] of Object.entries(state.newsByWidgetId)) {
        if (liveIds.has(id)) prunedNews[id] = items;
      }
      const types = new Set((active?.widgets ?? []).map((w) => w.type));
      return {
        config: next,
        newsByWidgetId: prunedNews,
        // Drop finance payloads when those widgets leave the board
        crypto: types.has('crypto') || types.has('portfolio') ? state.crypto : [],
        stocks: types.has('stocks') || types.has('portfolio') ? state.stocks : [],
        ping: types.has('ping') || types.has('ports') ? state.ping : [],
      };
    });
    get().applyTheme();
  },
  setMetrics: (metrics) =>
    set((state) => {
      const prev = state.metrics;
      const net = metrics.network[0];
      const prevNet = prev?.network[0];
      // Skip store updates when vitals are unchanged — cuts React re-renders
      if (
        prev &&
        prev.cpu.currentLoad === metrics.cpu.currentLoad &&
        prev.memory.percent === metrics.memory.percent &&
        (prevNet?.rxSec ?? 0) === (net?.rxSec ?? 0) &&
        (prevNet?.txSec ?? 0) === (net?.txSec ?? 0) &&
        (prev.gpu?.[0]?.utilization ?? 0) === (metrics.gpu?.[0]?.utilization ?? 0)
      ) {
        return state;
      }
      return {
        metrics,
        history: {
          cpu: pushHistory(state.history.cpu, { t: metrics.timestamp, v: metrics.cpu.currentLoad }),
          ram: pushHistory(state.history.ram, { t: metrics.timestamp, v: metrics.memory.percent }),
          netRx: pushHistory(state.history.netRx, { t: metrics.timestamp, v: net?.rxSec ?? 0 }),
          netTx: pushHistory(state.history.netTx, { t: metrics.timestamp, v: net?.txSec ?? 0 }),
        },
      };
    }),
  setPing: (ping) => set({ ping }),
  setCrypto: (crypto) => set({ crypto }),
  setStocks: (stocks) => set({ stocks }),
  setWeather: (weather) => set({ weather }),
  setExchange: (exchange) => set({ exchange }),
  setHeadline: (headline) => set({ headline }),
  setAqi: (aqi) => set({ aqi }),
  setNewsForWidget: (id, items) =>
    set((state) => ({
      newsByWidgetId: {
        ...state.newsByWidgetId,
        [id]: items.slice(0, 12),
      },
    })),
  setEditMode: (editMode) => set({ editMode }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setAddWidgetOpen: (addWidgetOpen) => set({ addWidgetOpen }),

  getActivePreset: () => {
    const { config } = get();
    return config.presets.find((p) => p.id === config.activePresetId) ?? config.presets[0];
  },

  updateLayout: (layout) =>
    set((state) => {
      const presets = state.config.presets.map((p) =>
        p.id === state.config.activePresetId ? { ...p, layout } : p,
      );
      return { config: { ...state.config, presets } };
    }),

  updateWidgetSettings: (id, settings) => {
    set((state) => {
      const presets = state.config.presets.map((p) => {
        if (p.id !== state.config.activePresetId) return p;
        return {
          ...p,
          widgets: p.widgets.map((w) =>
            w.id === id ? { ...w, settings: { ...w.settings, ...settings } } : w,
          ),
        };
      });
      return { config: { ...state.config, presets } };
    });
    // Persist gear changes without requiring Save (widgets previously lost settings on restart)
    void import('../hooks/useWebSocket').then(({ persistConfig }) => {
      void persistConfig(get().config).catch(() => undefined);
    });
  },

  removeWidget: (id) =>
    set((state) => {
      const presets = state.config.presets.map((p) => {
        if (p.id !== state.config.activePresetId) return p;
        return {
          ...p,
          widgets: p.widgets.filter((w) => w.id !== id),
          layout: p.layout.filter((l) => l.i !== id),
        };
      });
      const { [id]: _removed, ...restNews } = state.newsByWidgetId;
      return { config: { ...state.config, presets }, newsByWidgetId: restNews };
    }),

  addWidget: (widget, layoutItem) =>
    set((state) => {
      const presets = state.config.presets.map((p) => {
        if (p.id !== state.config.activePresetId) return p;
        return {
          ...p,
          widgets: [...p.widgets, widget],
          layout: [...p.layout, layoutItem],
        };
      });
      return { config: { ...state.config, presets } };
    }),

  applyTheme: () => {
    const { theme, shell } = get().config;
    const root = document.documentElement;
    root.classList.toggle('dark', theme.mode === 'dark');
    root.style.setProperty('--accent', hexToRgb(theme.accent));
    root.style.setProperty('--card-opacity', String(theme.cardOpacity));
    root.style.setProperty('--board-opacity', String(shell?.boardOpacity ?? 0.35));
    const radius =
      theme.cornerRadius === 'sharp' ? '6px' : theme.cornerRadius === 'round' ? '20px' : '14px';
    root.style.setProperty('--card-radius', radius);
    const fs = theme.fontSize === 's' ? '13px' : theme.fontSize === 'l' ? '16px' : '14px';
    root.style.setProperty('--ui-font-size', fs);
    root.classList.toggle('reduce-motion', Boolean(theme.reduceMotion));
  },
}));
