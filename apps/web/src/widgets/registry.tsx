import type { ComponentType } from 'react';
import { CpuWidget } from './system/CpuWidget';
import { RamWidget } from './system/RamWidget';
import { GpuWidget } from './system/GpuWidget';
import { DiskWidget } from './system/DiskWidget';
import { ProcessesWidget } from './system/ProcessesWidget';
import { BatteryWidget } from './system/BatteryWidget';
import { SystemInfoWidget } from './system/SystemInfoWidget';
import { NetworkSpeedWidget } from './network/NetworkSpeedWidget';
import { WifiWidget } from './network/WifiWidget';
import { IpsWidget } from './network/IpsWidget';
import { PingWidget } from './network/PingWidget';
import { DataUsageWidget } from './network/DataUsageWidget';
import { CryptoWidget } from './finance/CryptoWidget';
import { StocksWidget } from './finance/StocksWidget';
import { ClockWidget } from './extras/ClockWidget';
import { WeatherWidget } from './extras/WeatherWidget';
import { NotesWidget } from './extras/NotesWidget';
import { QuickLinksWidget } from './extras/QuickLinksWidget';

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
    defaultSettings: { sortBy: 'cpu', limit: 8 },
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
  'network-speed': {
    type: 'network-speed',
    name: 'Network Speed',
    category: 'network',
    description: 'Live up/down speeds',
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
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
  clock: {
    type: 'clock',
    name: 'Clocks',
    category: 'extras',
    description: 'Local and world clocks',
    defaultSize: { w: 2, h: 3, minW: 2, minH: 2 },
    defaultSettings: { timezones: ['UTC', 'America/New_York', 'Asia/Kolkata'] },
    component: ClockWidget,
  },
  weather: {
    type: 'weather',
    name: 'Weather',
    category: 'extras',
    description: 'Current weather',
    defaultSize: { w: 2, h: 3, minW: 2, minH: 2 },
    defaultSettings: { lat: 28.6139, lon: 77.209, city: 'New Delhi' },
    component: WeatherWidget,
  },
  notes: {
    type: 'notes',
    name: 'Notes',
    category: 'extras',
    description: 'Quick notes',
    defaultSize: { w: 4, h: 4, minW: 2, minH: 2 },
    component: NotesWidget,
  },
  'quick-links': {
    type: 'quick-links',
    name: 'Quick Links',
    category: 'extras',
    description: 'Bookmarks',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    component: QuickLinksWidget,
  },
};

export function getWidget(type: string): WidgetDefinition | undefined {
  return widgetRegistry[type];
}
