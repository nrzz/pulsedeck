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
export type Density = 'compact' | 'comfy' | 'spacious';
export type CornerRadius = 'sharp' | 'soft' | 'round';
export type FontSizePref = 's' | 'm' | 'l';
export type BoardScale = 0.85 | 1 | 1.15;

export interface ThemeConfig {
  mode: ThemeMode;
  accent: string;
  cardOpacity: number;
  density: Density;
  cornerRadius?: CornerRadius;
  fontSize?: FontSizePref;
  showWidgetTitles?: boolean;
  reduceMotion?: boolean;
}

/** Desktop widget-board preferences (ignored in browser) */
export interface ShellConfig {
  /** Overall board glass strength 0.35–1 */
  boardOpacity: number;
  /** When locked (click-through), keep the floating toolbar hidden */
  hideToolbarWhenLocked: boolean;
  /** CSS zoom on widget stage */
  scale?: BoardScale;
  /** react-grid-layout column count */
  gridCols?: 8 | 12 | 16;
  /** Snap widgets to grid */
  snapToGrid?: boolean;
  /** Threshold alerts */
  alerts?: {
    cpu?: number;
    ram?: number;
    disk?: number;
    temp?: number;
  };
  /** Defaults applied when adding a News tray widget */
  newsDefaults?: {
    topics?: string[];
    limit?: number;
    refreshMinutes?: number;
    showSource?: boolean;
    showTime?: boolean;
    density?: 'compact' | 'comfy';
    region?: 'IN' | 'US' | 'GB';
  };
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
    speed?: number;
    speedMin?: number;
    speedMax?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percent: number;
    swapTotal?: number;
    swapUsed?: number;
    swapFree?: number;
    swapPercent?: number;
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
  diskIO?: {
    rIO_sec?: number;
    wIO_sec?: number;
    rBytesPerSec?: number;
    wBytesPerSec?: number;
  };
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
  fans?: { label: string; rpm: number }[];
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

export const BANGALORE = { lat: 12.9716, lon: 77.5946, city: 'Bangalore' } as const;

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  accent: '#14b8a6',
  cardOpacity: 0.88,
  density: 'comfy',
  cornerRadius: 'soft',
  fontSize: 'm',
  showWidgetTitles: true,
  reduceMotion: false,
};

export const DEFAULT_SHELL: ShellConfig = {
  boardOpacity: 0.35,
  hideToolbarWhenLocked: true,
  scale: 1,
  gridCols: 12,
  snapToGrid: true,
  alerts: { cpu: 90, ram: 90, disk: 90, temp: 85 },
  newsDefaults: {
    topics: ['technology', 'world', 'india', 'business'],
    limit: 20,
    refreshMinutes: 20,
    showSource: true,
    showTime: false,
    density: 'compact',
    region: 'IN',
  },
};

/** Curated lightweight RSS topics (titles + links only — no article bodies). */
export const NEWS_TOPICS = [
  {
    id: 'technology',
    label: 'Technology',
    feed: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
  },
  { id: 'world', label: 'World', feed: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { id: 'business', label: 'Business', feed: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  {
    id: 'science',
    label: 'Science',
    feed: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    feed: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
  },
  { id: 'health', label: 'Health', feed: 'https://feeds.bbci.co.uk/news/health/rss.xml' },
  {
    id: 'india',
    label: 'India',
    feed: 'https://news.google.com/rss/headlines/section/geo/India?hl=en-IN&gl=IN&ceid=IN:en',
  },
  {
    id: 'markets',
    label: 'Markets',
    feed: 'https://news.google.com/rss/search?q=stock+markets&hl=en-IN&gl=IN&ceid=IN:en',
  },
  {
    id: 'ai',
    label: 'AI',
    feed: 'https://news.google.com/rss/search?q=artificial+intelligence&hl=en-IN&gl=IN&ceid=IN:en',
  },
  {
    id: 'startups',
    label: 'Startups',
    feed: 'https://news.google.com/rss/search?q=startups&hl=en-IN&gl=IN&ceid=IN:en',
  },
  { id: 'hacker-news', label: 'Hacker News', feed: 'https://news.ycombinator.com/rss' },
  { id: 'verge', label: 'The Verge', feed: 'https://www.theverge.com/rss/index.xml' },
  {
    id: 'sports',
    label: 'Sports',
    feed: 'https://feeds.bbci.co.uk/sport/rss.xml',
  },
] as const;

export type NewsTopicId = (typeof NEWS_TOPICS)[number]['id'];

export const NEWS_SUGGESTIONS = [
  {
    id: 'daily-brief',
    name: 'Daily brief',
    description: 'Tech + world + India + business + AI',
    topics: ['technology', 'world', 'india', 'business', 'ai'] as NewsTopicId[],
  },
  {
    id: 'tech-pulse',
    name: 'Tech pulse',
    description: 'Tech + AI + HN + Verge',
    topics: ['technology', 'ai', 'hacker-news', 'verge'] as NewsTopicId[],
  },
  {
    id: 'india-morning',
    name: 'India morning',
    description: 'India + business + world',
    topics: ['india', 'business', 'world'] as NewsTopicId[],
  },
  {
    id: 'markets-desk',
    name: 'Markets desk',
    description: 'Markets + business',
    topics: ['markets', 'business'] as NewsTopicId[],
  },
  {
    id: 'science-brief',
    name: 'Science brief',
    description: 'Science + health',
    topics: ['science', 'health'] as NewsTopicId[],
  },
  {
    id: 'world-brief',
    name: 'World brief',
    description: 'World + politics feel',
    topics: ['world', 'india'] as NewsTopicId[],
  },
  {
    id: 'builder',
    name: 'Builder feed',
    description: 'Startups + Verge + HN',
    topics: ['startups', 'verge', 'hacker-news'] as NewsTopicId[],
  },
] as const;

export interface NewsItem {
  title: string;
  link?: string;
  source?: string;
  published?: string;
  topic?: string;
}

export interface NewsFeedResult {
  items: NewsItem[];
  fetchedAt: number;
}

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
  { id: 'weather-1', type: 'weather', settings: { ...BANGALORE } },
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
  { id: 'disk-1', type: 'disk', settings: {} },
  { id: 'clock-1', type: 'clock', settings: { timezones: ['Asia/Kolkata', 'UTC'] } },
  { id: 'weather-1', type: 'weather', settings: { ...BANGALORE } },
];

export const DESKTOP_LAYOUT: LayoutItem[] = [
  { i: 'cpu-1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
  { i: 'ram-1', x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
  { i: 'net-1', x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'disk-1', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 2 },
  { i: 'clock-1', x: 4, y: 3, w: 4, h: 3, minW: 2, minH: 2 },
  { i: 'weather-1', x: 8, y: 3, w: 4, h: 3, minW: 2, minH: 2 },
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
  { type: 'uptime', name: 'Uptime', category: 'system', description: 'Time since boot' },
  { type: 'temps', name: 'Temperatures', category: 'system', description: 'CPU and GPU temps' },
  { type: 'fans', name: 'Fans', category: 'system', description: 'Fan speeds' },
  { type: 'cpu-freq', name: 'CPU Frequency', category: 'system', description: 'Clock speeds' },
  { type: 'swap', name: 'Swap', category: 'system', description: 'Pagefile / swap usage' },
  { type: 'disk-io', name: 'Disk I/O', category: 'system', description: 'Read/write activity' },
  {
    type: 'top-memory',
    name: 'Top Memory',
    category: 'system',
    description: 'Processes by RAM',
  },
  { type: 'sensors', name: 'Sensors', category: 'system', description: 'Temp, fan, battery strip' },
  { type: 'alerts', name: 'Alerts', category: 'system', description: 'Threshold status board' },
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
  {
    type: 'net-adapters',
    name: 'Adapters',
    category: 'network',
    description: 'Per-interface status',
  },
  {
    type: 'net-graph',
    name: 'Net Graph',
    category: 'network',
    description: 'RX/TX history sparkline',
  },
  { type: 'ports', name: 'Ports', category: 'network', description: 'Watched hosts / ports' },
  {
    type: 'bandwidth-cap',
    name: 'Bandwidth Cap',
    category: 'network',
    description: 'Session usage vs cap',
  },
  { type: 'crypto', name: 'Crypto', category: 'finance', description: 'Crypto watchlist' },
  { type: 'stocks', name: 'Stocks', category: 'finance', description: 'Stock quotes' },
  { type: 'exchange', name: 'Exchange', category: 'finance', description: 'FX rates' },
  {
    type: 'market-strip',
    name: 'Market Strip',
    category: 'finance',
    description: 'Compact ticker row',
  },
  {
    type: 'portfolio',
    name: 'Portfolio',
    category: 'finance',
    description: 'Simple holdings tracker',
  },
  { type: 'clock', name: 'Clocks', category: 'extras', description: 'Local and world clocks' },
  {
    type: 'world-clocks',
    name: 'World Clocks',
    category: 'extras',
    description: 'Multi-city digital strip',
  },
  { type: 'weather', name: 'Weather', category: 'extras', description: 'Current weather' },
  { type: 'aqi', name: 'Air Quality', category: 'extras', description: 'AQI for your city' },
  { type: 'notes', name: 'Notes', category: 'extras', description: 'Quick notes' },
  { type: 'todo', name: 'Todo', category: 'extras', description: 'Checklist' },
  { type: 'calendar', name: 'Calendar', category: 'extras', description: 'Month calendar' },
  { type: 'timer', name: 'Timer', category: 'extras', description: 'Pomodoro countdown' },
  { type: 'stopwatch', name: 'Stopwatch', category: 'extras', description: 'Elapsed timer' },
  { type: 'quick-links', name: 'Quick Links', category: 'extras', description: 'Bookmarks' },
  { type: 'launcher', name: 'Launcher', category: 'extras', description: 'Quick launch buttons' },
  { type: 'headline', name: 'Headline', category: 'extras', description: 'RSS headline' },
  {
    type: 'news',
    name: 'News tray',
    category: 'extras',
    description: 'Topic headlines with suggestions',
  },
  { type: 'media', name: 'Now Playing', category: 'extras', description: 'Media session' },
  { type: 'clipboard', name: 'Clipboard', category: 'extras', description: 'Recent clipboard' },
  {
    type: 'active-app',
    name: 'Active App',
    category: 'extras',
    description: 'Foreground window',
  },
  { type: 'hotkeys', name: 'Hotkeys', category: 'extras', description: 'Shortcut cheat-sheet' },
] as const;

export type WidgetType = (typeof WIDGET_CATALOG)[number]['type'];

/** Named layout packs for one-click apply */
export function createNamedPresets(): LayoutPreset[] {
  const cell = (i: string, x: number, y: number, w = 4, h = 3): LayoutItem => ({
    i,
    x,
    y,
    w,
    h,
    minW: 2,
    minH: 2,
  });
  return [
    {
      id: 'preset-minimal',
      name: 'Minimal',
      widgets: [
        { id: 'cpu-1', type: 'cpu', settings: {} },
        { id: 'ram-1', type: 'ram', settings: {} },
        { id: 'clock-1', type: 'clock', settings: { timezones: ['Asia/Kolkata'] } },
        { id: 'weather-1', type: 'weather', settings: { ...BANGALORE } },
      ],
      layout: [
        cell('cpu-1', 0, 0),
        cell('ram-1', 4, 0),
        cell('clock-1', 8, 0),
        cell('weather-1', 0, 3),
      ],
    },
    {
      id: 'preset-system',
      name: 'System',
      widgets: [
        { id: 'cpu-1', type: 'cpu', settings: {} },
        { id: 'ram-1', type: 'ram', settings: {} },
        { id: 'gpu-1', type: 'gpu', settings: {} },
        { id: 'disk-1', type: 'disk', settings: {} },
        { id: 'diskio-1', type: 'disk-io', settings: {} },
        { id: 'temps-1', type: 'temps', settings: {} },
        { id: 'proc-1', type: 'processes', settings: { sortBy: 'cpu', limit: 8 } },
      ],
      layout: [
        cell('cpu-1', 0, 0),
        cell('ram-1', 4, 0),
        cell('gpu-1', 8, 0),
        cell('disk-1', 0, 3),
        cell('diskio-1', 4, 3),
        cell('temps-1', 8, 3),
        cell('proc-1', 0, 6, 8, 4),
      ],
    },
    {
      id: 'preset-network',
      name: 'Network',
      widgets: [
        { id: 'net-1', type: 'network-speed', settings: {} },
        { id: 'wifi-1', type: 'wifi', settings: {} },
        { id: 'ips-1', type: 'ips', settings: {} },
        { id: 'ping-1', type: 'ping', settings: { hosts: ['1.1.1.1', '8.8.8.8'] } },
        { id: 'adapters-1', type: 'net-adapters', settings: {} },
        { id: 'data-1', type: 'data-usage', settings: {} },
      ],
      layout: [
        cell('net-1', 0, 0),
        cell('wifi-1', 4, 0),
        cell('ips-1', 8, 0),
        cell('ping-1', 0, 3),
        cell('adapters-1', 4, 3),
        cell('data-1', 8, 3),
      ],
    },
    {
      id: 'preset-finance',
      name: 'Finance',
      widgets: [
        { id: 'crypto-1', type: 'crypto', settings: { symbols: ['bitcoin', 'ethereum'] } },
        { id: 'stocks-1', type: 'stocks', settings: { symbols: ['AAPL', 'MSFT'] } },
        { id: 'fx-1', type: 'exchange', settings: { pairs: ['USD/INR', 'EUR/INR'] } },
      ],
      layout: [cell('crypto-1', 0, 0, 4, 4), cell('stocks-1', 4, 0, 4, 4), cell('fx-1', 8, 0, 4, 3)],
    },
    {
      id: 'preset-focus',
      name: 'Focus',
      widgets: [
        { id: 'clock-1', type: 'clock', settings: { timezones: ['Asia/Kolkata', 'UTC'] } },
        { id: 'cal-1', type: 'calendar', settings: {} },
        { id: 'todo-1', type: 'todo', settings: { items: [] } },
        { id: 'timer-1', type: 'timer', settings: {} },
        { id: 'notes-1', type: 'notes', settings: {} },
        { id: 'app-1', type: 'active-app', settings: {} },
        {
          id: 'news-1',
          type: 'news',
          settings: {
            topics: ['technology', 'world', 'india', 'business', 'ai'],
            limit: 20,
            refreshMinutes: 20,
            showSource: true,
            density: 'compact',
          },
        },
      ],
      layout: [
        cell('clock-1', 0, 0),
        cell('cal-1', 4, 0),
        cell('todo-1', 8, 0, 4, 4),
        cell('timer-1', 0, 3),
        cell('notes-1', 4, 3, 4, 4),
        cell('app-1', 0, 6),
        cell('news-1', 4, 7, 8, 4),
      ],
    },
    {
      id: 'preset-full',
      name: 'Full monitor',
      widgets: [
        { id: 'cpu-1', type: 'cpu', settings: {} },
        { id: 'ram-1', type: 'ram', settings: {} },
        { id: 'gpu-1', type: 'gpu', settings: {} },
        { id: 'disk-1', type: 'disk', settings: {} },
        { id: 'temps-1', type: 'temps', settings: {} },
        { id: 'net-1', type: 'network-speed', settings: {} },
        { id: 'ping-1', type: 'ping', settings: { hosts: ['1.1.1.1'] } },
        { id: 'proc-1', type: 'processes', settings: { limit: 6 } },
      ],
      layout: [
        cell('cpu-1', 0, 0, 3, 3),
        cell('ram-1', 3, 0, 3, 3),
        cell('gpu-1', 6, 0, 3, 3),
        cell('disk-1', 9, 0, 3, 3),
        cell('temps-1', 0, 3, 3, 3),
        cell('net-1', 3, 3, 3, 3),
        cell('ping-1', 6, 3, 3, 3),
        cell('proc-1', 9, 3, 3, 4),
      ],
    },
  ];
}
