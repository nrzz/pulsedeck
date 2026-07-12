import type { ComponentType } from 'react';
import { CpuWidget } from './system/CpuWidget';
import { RamWidget } from './system/RamWidget';
import { GpuWidget } from './system/GpuWidget';
import { DiskWidget } from './system/DiskWidget';
import { ProcessesWidget } from './system/ProcessesWidget';
import { BatteryWidget } from './system/BatteryWidget';
import { SystemInfoWidget } from './system/SystemInfoWidget';
import { UptimeWidget } from './system/UptimeWidget';
import { TempsWidget } from './system/TempsWidget';
import { FansWidget } from './system/FansWidget';
import { CpuFreqWidget } from './system/CpuFreqWidget';
import { SwapWidget } from './system/SwapWidget';
import { DiskIoWidget } from './system/DiskIoWidget';
import { TopMemoryWidget } from './system/TopMemoryWidget';
import { SensorsWidget } from './system/SensorsWidget';
import { AlertsWidget } from './system/AlertsWidget';
import { NetworkSpeedWidget } from './network/NetworkSpeedWidget';
import { WifiWidget } from './network/WifiWidget';
import { IpsWidget } from './network/IpsWidget';
import { PingWidget } from './network/PingWidget';
import { DataUsageWidget } from './network/DataUsageWidget';
import { NetAdaptersWidget } from './network/NetAdaptersWidget';
import { NetGraphWidget } from './network/NetGraphWidget';
import { PortsWidget } from './network/PortsWidget';
import { BandwidthCapWidget } from './network/BandwidthCapWidget';
import { CryptoWidget } from './finance/CryptoWidget';
import { StocksWidget } from './finance/StocksWidget';
import { ExchangeWidget } from './finance/ExchangeWidget';
import { MarketStripWidget } from './finance/MarketStripWidget';
import { PortfolioWidget } from './finance/PortfolioWidget';
import { ClockWidget } from './extras/ClockWidget';
import { WorldClocksWidget } from './extras/WorldClocksWidget';
import { WeatherWidget } from './extras/WeatherWidget';
import { AqiWidget } from './extras/AqiWidget';
import { NotesWidget } from './extras/NotesWidget';
import { TodoWidget } from './extras/TodoWidget';
import { CalendarWidget } from './extras/CalendarWidget';
import { TimerWidget } from './extras/TimerWidget';
import { StopwatchWidget } from './extras/StopwatchWidget';
import { QuickLinksWidget } from './extras/QuickLinksWidget';
import { LauncherWidget } from './extras/LauncherWidget';
import { HeadlineWidget } from './extras/HeadlineWidget';
import { NewsWidget } from './extras/NewsWidget';
import { MediaWidget } from './extras/MediaWidget';
import { ClipboardWidget } from './extras/ClipboardWidget';
import { ActiveAppWidget } from './extras/ActiveAppWidget';
import { HotkeysWidget } from './extras/HotkeysWidget';

export interface WidgetProps {
  id: string;
  settings: Record<string, unknown>;
}

export interface WidgetDefinition {
  type: string;
  name: string;
  category: 'system' | 'network' | 'finance' | 'extras';
  description: string;
  defaultSize: { w: number; h: number; minW?: number; minH?: number };
  defaultSettings?: Record<string, unknown>;
  component: ComponentType<WidgetProps>;
}

export const widgetRegistry: Record<string, WidgetDefinition> = {
  cpu: {
    type: 'cpu',
    name: 'CPU',
    category: 'system',
    description: 'CPU usage and per-core load',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    component: CpuWidget,
  },
  ram: {
    type: 'ram',
    name: 'Memory',
    category: 'system',
    description: 'RAM usage',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    component: RamWidget,
  },
  gpu: {
    type: 'gpu',
    name: 'GPU',
    category: 'system',
    description: 'GPU utilization and VRAM',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    component: GpuWidget,
  },
  disk: {
    type: 'disk',
    name: 'Disks',
    category: 'system',
    description: 'Drive space breakdown',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    component: DiskWidget,
  },
  processes: {
    type: 'processes',
    name: 'Processes',
    category: 'system',
    description: 'Top processes by CPU/RAM',
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    defaultSettings: { sortBy: 'cpu', limit: 5 },
    component: ProcessesWidget,
  },
  battery: {
    type: 'battery',
    name: 'Battery',
    category: 'system',
    description: 'Battery status',
    defaultSize: { w: 2, h: 2, minW: 2, minH: 2 },
    component: BatteryWidget,
  },
  'system-info': {
    type: 'system-info',
    name: 'System Info',
    category: 'system',
    description: 'Hostname, uptime, OS',
    defaultSize: { w: 2, h: 2, minW: 2, minH: 2 },
    component: SystemInfoWidget,
  },
  uptime: {
    type: 'uptime',
    name: 'Uptime',
    category: 'system',
    description: 'Time since boot',
    defaultSize: { w: 2, h: 2, minW: 2, minH: 2 },
    component: UptimeWidget,
  },
  temps: {
    type: 'temps',
    name: 'Temperatures',
    category: 'system',
    description: 'CPU and GPU temps',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    component: TempsWidget,
  },
  fans: {
    type: 'fans',
    name: 'Fans',
    category: 'system',
    description: 'Fan speeds',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    component: FansWidget,
  },
  'cpu-freq': {
    type: 'cpu-freq',
    name: 'CPU Frequency',
    category: 'system',
    description: 'Clock speeds',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    component: CpuFreqWidget,
  },
  swap: {
    type: 'swap',
    name: 'Swap',
    category: 'system',
    description: 'Pagefile / swap usage',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    component: SwapWidget,
  },
  'disk-io': {
    type: 'disk-io',
    name: 'Disk I/O',
    category: 'system',
    description: 'Read/write activity',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    component: DiskIoWidget,
  },
  'top-memory': {
    type: 'top-memory',
    name: 'Top Memory',
    category: 'system',
    description: 'Processes by RAM',
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    defaultSettings: { limit: 5 },
    component: TopMemoryWidget,
  },
  sensors: {
    type: 'sensors',
    name: 'Sensors',
    category: 'system',
    description: 'Temp, fan, battery strip',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    component: SensorsWidget,
  },
  alerts: {
    type: 'alerts',
    name: 'Alerts',
    category: 'system',
    description: 'Threshold status board',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    component: AlertsWidget,
  },
  'network-speed': {
    type: 'network-speed',
    name: 'Network Speed',
    category: 'network',
    description: 'Live up/down speeds',
    defaultSize: { w: 4, h: 3, minW: 3, minH: 3 },
    component: NetworkSpeedWidget,
  },
  wifi: {
    type: 'wifi',
    name: 'Wi-Fi',
    category: 'network',
    description: 'SSID and signal',
    defaultSize: { w: 2, h: 2, minW: 2, minH: 2 },
    component: WifiWidget,
  },
  ips: {
    type: 'ips',
    name: 'IP Addresses',
    category: 'network',
    description: 'Local and public IPs',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    component: IpsWidget,
  },
  ping: {
    type: 'ping',
    name: 'Ping Monitor',
    category: 'network',
    description: 'Latency to hosts',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    defaultSettings: { hosts: ['1.1.1.1', '8.8.8.8', 'google.com'] },
    component: PingWidget,
  },
  'data-usage': {
    type: 'data-usage',
    name: 'Data Usage',
    category: 'network',
    description: 'Session RX/TX totals',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    component: DataUsageWidget,
  },
  'net-adapters': {
    type: 'net-adapters',
    name: 'Adapters',
    category: 'network',
    description: 'Per-interface status',
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    component: NetAdaptersWidget,
  },
  'net-graph': {
    type: 'net-graph',
    name: 'Net Graph',
    category: 'network',
    description: 'RX/TX history sparkline',
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    component: NetGraphWidget,
  },
  ports: {
    type: 'ports',
    name: 'Ports',
    category: 'network',
    description: 'Watched hosts / ports',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    defaultSettings: { hosts: ['1.1.1.1:443', '8.8.8.8:53'] },
    component: PortsWidget,
  },
  'bandwidth-cap': {
    type: 'bandwidth-cap',
    name: 'Bandwidth Cap',
    category: 'network',
    description: 'Session usage vs cap',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultSettings: { capGb: 100 },
    component: BandwidthCapWidget,
  },
  crypto: {
    type: 'crypto',
    name: 'Crypto',
    category: 'finance',
    description: 'Crypto watchlist',
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    defaultSettings: { symbols: ['bitcoin', 'ethereum', 'solana'] },
    component: CryptoWidget,
  },
  stocks: {
    type: 'stocks',
    name: 'Stocks',
    category: 'finance',
    description: 'Stock quotes',
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    defaultSettings: { symbols: ['AAPL', 'MSFT', 'GOOGL', 'TSLA'] },
    component: StocksWidget,
  },
  exchange: {
    type: 'exchange',
    name: 'Exchange',
    category: 'finance',
    description: 'FX rates',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    defaultSettings: { pairs: ['USD/INR', 'EUR/INR'] },
    component: ExchangeWidget,
  },
  'market-strip': {
    type: 'market-strip',
    name: 'Market Strip',
    category: 'finance',
    description: 'Compact ticker row',
    defaultSize: { w: 6, h: 2, minW: 4, minH: 2 },
    component: MarketStripWidget,
  },
  portfolio: {
    type: 'portfolio',
    name: 'Portfolio',
    category: 'finance',
    description: 'Simple holdings tracker',
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    defaultSettings: {
      holdings: [
        { symbol: 'bitcoin', amount: 0.1, kind: 'crypto' },
        { symbol: 'AAPL', amount: 5, kind: 'stock' },
      ],
    },
    component: PortfolioWidget,
  },
  clock: {
    type: 'clock',
    name: 'Clocks',
    category: 'extras',
    description: 'Local and world clocks',
    defaultSize: { w: 2, h: 3, minW: 2, minH: 2 },
    defaultSettings: { timezones: ['UTC', 'America/New_York', 'Asia/Kolkata'] },
    component: ClockWidget,
  },
  'world-clocks': {
    type: 'world-clocks',
    name: 'World Clocks',
    category: 'extras',
    description: 'Multi-city digital strip',
    defaultSize: { w: 4, h: 2, minW: 3, minH: 2 },
    defaultSettings: {
      timezones: ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London'],
    },
    component: WorldClocksWidget,
  },
  weather: {
    type: 'weather',
    name: 'Weather',
    category: 'extras',
    description: 'Current weather',
    defaultSize: { w: 2, h: 3, minW: 2, minH: 2 },
    defaultSettings: { lat: 12.9716, lon: 77.5946, city: 'Bangalore' },
    component: WeatherWidget,
  },
  aqi: {
    type: 'aqi',
    name: 'Air Quality',
    category: 'extras',
    description: 'AQI for your city',
    defaultSize: { w: 2, h: 2, minW: 2, minH: 2 },
    defaultSettings: { lat: 12.9716, lon: 77.5946, city: 'Bangalore' },
    component: AqiWidget,
  },
  notes: {
    type: 'notes',
    name: 'Notes',
    category: 'extras',
    description: 'Quick notes',
    defaultSize: { w: 4, h: 4, minW: 2, minH: 2 },
    component: NotesWidget,
  },
  todo: {
    type: 'todo',
    name: 'Todo',
    category: 'extras',
    description: 'Checklist',
    defaultSize: { w: 3, h: 4, minW: 2, minH: 2 },
    defaultSettings: { items: [] },
    component: TodoWidget,
  },
  calendar: {
    type: 'calendar',
    name: 'Calendar',
    category: 'extras',
    description: 'Month calendar',
    defaultSize: { w: 3, h: 4, minW: 2, minH: 3 },
    component: CalendarWidget,
  },
  timer: {
    type: 'timer',
    name: 'Timer',
    category: 'extras',
    description: 'Pomodoro countdown',
    defaultSize: { w: 2, h: 3, minW: 2, minH: 2 },
    component: TimerWidget,
  },
  stopwatch: {
    type: 'stopwatch',
    name: 'Stopwatch',
    category: 'extras',
    description: 'Elapsed timer',
    defaultSize: { w: 2, h: 2, minW: 2, minH: 2 },
    component: StopwatchWidget,
  },
  'quick-links': {
    type: 'quick-links',
    name: 'Quick Links',
    category: 'extras',
    description: 'Bookmarks',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    component: QuickLinksWidget,
  },
  launcher: {
    type: 'launcher',
    name: 'Launcher',
    category: 'extras',
    description: 'Quick launch buttons',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    component: LauncherWidget,
  },
  headline: {
    type: 'headline',
    name: 'Headline',
    category: 'extras',
    description: 'RSS headline',
    defaultSize: { w: 4, h: 2, minW: 3, minH: 2 },
    defaultSettings: { feedUrl: 'https://news.ycombinator.com/rss' },
    component: HeadlineWidget,
  },
  news: {
    type: 'news',
    name: 'News tray',
    category: 'extras',
    description: 'Topic headlines with suggestions',
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    defaultSettings: {
      topics: ['technology', 'world'],
      limit: 5,
      refreshMinutes: 20,
      showSource: true,
      showTime: false,
      density: 'compact',
      feeds: [],
    },
    component: NewsWidget,
  },
  media: {
    type: 'media',
    name: 'Now Playing',
    category: 'extras',
    description: 'Media session',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    component: MediaWidget,
  },
  clipboard: {
    type: 'clipboard',
    name: 'Clipboard',
    category: 'extras',
    description: 'Recent clipboard',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    component: ClipboardWidget,
  },
  'active-app': {
    type: 'active-app',
    name: 'Active App',
    category: 'extras',
    description: 'Foreground window',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    component: ActiveAppWidget,
  },
  hotkeys: {
    type: 'hotkeys',
    name: 'Hotkeys',
    category: 'extras',
    description: 'Shortcut cheat-sheet',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    component: HotkeysWidget,
  },
};

export function getWidget(type: string): WidgetDefinition | undefined {
  return widgetRegistry[type];
}
