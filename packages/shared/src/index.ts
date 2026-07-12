/** Grid layout item compatible with react-grid-layout */
export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export type ThemeMode = 'dark' | 'light';
export type Density = 'compact' | 'comfy';

export interface ThemeConfig {
  mode: ThemeMode;
  accent: string;
  cardOpacity: number;
  density: Density;
}

/** Desktop widget-board preferences (ignored in browser) */
export interface ShellConfig {
  /** Overall board glass strength 0.35–1 */
  boardOpacity: number;
  /** When locked (click-through), keep the floating toolbar hidden */
  hideToolbarWhenLocked: boolean;
}

export interface WidgetInstance {
  id: string;
  type: string;
  settings: Record<string, unknown>;
}

export interface LayoutPreset {
  id: string;
  name: string;
  layout: LayoutItem[];
  widgets: WidgetInstance[];
}

export interface AppConfig {
  version: number;
  theme: ThemeConfig;
  shell: ShellConfig;
  activePresetId: string;
  presets: LayoutPreset[];
  apiKeys: {
    finnhub?: string;
  };
  notes: string;
  quickLinks: QuickLink[];
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

/** Live system metrics streamed over WebSocket */
export interface SystemMetrics {
  timestamp: number;
  cpu: {
    currentLoad: number;
    cores: number[];
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  gpu?: {
    model: string;
    utilization: number;
    memoryUsed?: number;
    memoryTotal?: number;
    temperature?: number;
  }[];
  disks: {
    fs: string;
    mount: string;
    type: string;
    size: number;
    used: number;
    available: number;
    percent: number;
  }[];
  network: {
    iface: string;
    rxSec: number;
    txSec: number;
    rxBytes: number;
    txBytes: number;
    operstate: string;
  }[];
  wifi?: {
    ssid: string;
    signalLevel: number;
    quality: number;
    frequency?: number;
  };
  battery?: {
    hasBattery: boolean;
    isCharging: boolean;
    percent: number;
    timeRemaining?: number;
  };
  processes: {
    pid: number;
    name: string;
    cpu: number;
    mem: number;
    memRss: number;
  }[];
  system: {
    manufacturer: string;
    model: string;
    hostname: string;
    platform: string;
    release: string;
    arch: string;
    uptime: number;
  };
  ips: {
    local: string[];
    public?: string;
  };
}

export interface PingResult {
  host: string;
  alive: boolean;
  timeMs: number | null;
  timestamp: number;
}

export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sparkline: number[];
  image?: string;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity?: number;
  city?: string;
}

export type WsMessageType =
  'metrics' | 'ping' | 'crypto' | 'stocks' | 'weather' | 'config' | 'error' | 'subscribe';

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  payload: T;
}

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  accent: '#14b8a6',
  cardOpacity: 0.88,
  density: 'comfy',
};

export const DEFAULT_SHELL: ShellConfig = {
  boardOpacity: 0.35,
  hideToolbarWhenLocked: true,
};

export const DEFAULT_WIDGETS: WidgetInstance[] = [
  { id: 'cpu-1', type: 'cpu', settings: {} },
  { id: 'ram-1', type: 'ram', settings: {} },
  { id: 'gpu-1', type: 'gpu', settings: {} },
  { id: 'disk-1', type: 'disk', settings: {} },
  { id: 'net-1', type: 'network-speed', settings: {} },
  { id: 'proc-1', type: 'processes', settings: { sortBy: 'cpu', limit: 8 } },
  { id: 'sys-1', type: 'system-info', settings: {} },
  { id: 'wifi-1', type: 'wifi', settings: {} },
  { id: 'crypto-1', type: 'crypto', settings: { symbols: ['bitcoin', 'ethereum', 'solana'] } },
  {
    id: 'clock-1',
    type: 'clock',
    settings: { timezones: ['UTC', 'America/New_York', 'Asia/Kolkata'] },
  },
  { id: 'weather-1', type: 'weather', settings: { lat: 28.6139, lon: 77.209, city: 'New Delhi' } },
  { id: 'notes-1', type: 'notes', settings: {} },
];

export const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'cpu-1', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
  { i: 'ram-1', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
  { i: 'gpu-1', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
  { i: 'disk-1', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
  { i: 'net-1', x: 0, y: 3, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'proc-1', x: 4, y: 3, w: 4, h: 4, minW: 3, minH: 3 },
  { i: 'sys-1', x: 8, y: 3, w: 2, h: 2, minW: 2, minH: 2 },
  { i: 'wifi-1', x: 10, y: 3, w: 2, h: 2, minW: 2, minH: 2 },
  { i: 'crypto-1', x: 0, y: 7, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'clock-1', x: 4, y: 7, w: 2, h: 3, minW: 2, minH: 2 },
  { i: 'weather-1', x: 6, y: 7, w: 2, h: 3, minW: 2, minH: 2 },
  { i: 'notes-1', x: 8, y: 5, w: 4, h: 5, minW: 2, minH: 2 },
];

/** Compact floating-widget preset for the desktop shell */
export const DESKTOP_WIDGETS: WidgetInstance[] = [
  { id: 'cpu-1', type: 'cpu', settings: {} },
  { id: 'ram-1', type: 'ram', settings: {} },
  { id: 'net-1', type: 'network-speed', settings: {} },
  { id: 'clock-1', type: 'clock', settings: { timezones: ['Asia/Kolkata', 'UTC'] } },
  { id: 'weather-1', type: 'weather', settings: { lat: 28.6139, lon: 77.209, city: 'New Delhi' } },
];

export const DESKTOP_LAYOUT: LayoutItem[] = [
  { i: 'cpu-1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
  { i: 'ram-1', x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
  { i: 'net-1', x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'clock-1', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 2 },
  { i: 'weather-1', x: 4, y: 3, w: 4, h: 3, minW: 2, minH: 2 },
];

export function createDesktopPreset(): LayoutPreset {
  return {
    id: 'desktop',
    name: 'Desktop',
    layout: [...DESKTOP_LAYOUT],
    widgets: DESKTOP_WIDGETS.map((w) => ({ ...w, settings: { ...w.settings } })),
  };
}

export function createDefaultConfig(): AppConfig {
  return {
    version: 1,
    theme: { ...DEFAULT_THEME },
    shell: { ...DEFAULT_SHELL },
    activePresetId: 'default',
    presets: [
      {
        id: 'default',
        name: 'Default',
        layout: [...DEFAULT_LAYOUT],
        widgets: DEFAULT_WIDGETS.map((w) => ({ ...w, settings: { ...w.settings } })),
      },
      createDesktopPreset(),
    ],
    apiKeys: {},
    notes: '',
    quickLinks: [
      { id: 'gh', title: 'GitHub', url: 'https://github.com' },
      { id: 'yt', title: 'YouTube', url: 'https://youtube.com' },
    ],
  };
}

export const WIDGET_CATALOG = [
  { type: 'cpu', name: 'CPU', category: 'system', description: 'CPU usage and per-core load' },
  { type: 'ram', name: 'Memory', category: 'system', description: 'RAM usage' },
  { type: 'gpu', name: 'GPU', category: 'system', description: 'GPU utilization and VRAM' },
  { type: 'disk', name: 'Disks', category: 'system', description: 'Drive space breakdown' },
  {
    type: 'processes',
    name: 'Processes',
    category: 'system',
    description: 'Top processes by CPU/RAM',
  },
  { type: 'battery', name: 'Battery', category: 'system', description: 'Battery status' },
  {
    type: 'system-info',
    name: 'System Info',
    category: 'system',
    description: 'Hostname, uptime, OS',
  },
  {
    type: 'network-speed',
    name: 'Network Speed',
    category: 'network',
    description: 'Live up/down speeds',
  },
  { type: 'wifi', name: 'Wi-Fi', category: 'network', description: 'SSID and signal' },
  { type: 'ips', name: 'IP Addresses', category: 'network', description: 'Local and public IPs' },
  { type: 'ping', name: 'Ping Monitor', category: 'network', description: 'Latency to hosts' },
  {
    type: 'data-usage',
    name: 'Data Usage',
    category: 'network',
    description: 'Session RX/TX totals',
  },
  { type: 'crypto', name: 'Crypto', category: 'finance', description: 'Crypto watchlist' },
  { type: 'stocks', name: 'Stocks', category: 'finance', description: 'Stock quotes' },
  { type: 'clock', name: 'Clocks', category: 'extras', description: 'Local and world clocks' },
  { type: 'weather', name: 'Weather', category: 'extras', description: 'Current weather' },
  { type: 'notes', name: 'Notes', category: 'extras', description: 'Quick notes' },
  { type: 'quick-links', name: 'Quick Links', category: 'extras', description: 'Bookmarks' },
] as const;

export type WidgetType = (typeof WIDGET_CATALOG)[number]['type'];
