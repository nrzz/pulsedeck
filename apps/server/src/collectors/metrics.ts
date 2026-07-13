import si from 'systeminformation';
import type { SystemMetrics } from '@pulsedeck/shared';
import { enrichGpuMetrics } from './gpu.js';
import { collectFans } from './fans.js';
import { sampleCpu, sampleMem } from './fast-vitals.js';

let publicIpCache: { ip?: string; fetchedAt: number } = { fetchedAt: 0 };
const PUBLIC_IP_TTL = 10 * 60 * 1000;

type SlowCache = {
  processes: SystemMetrics['processes'];
  wifi?: SystemMetrics['wifi'];
  gpu?: SystemMetrics['gpu'];
  disks: SystemMetrics['disks'];
  battery?: SystemMetrics['battery'];
  system?: SystemMetrics['system'];
  localIps: string[];
  fans?: SystemMetrics['fans'];
  diskIO?: SystemMetrics['diskIO'];
  cpuSpeed?: { speed?: number; speedMin?: number; speedMax?: number };
  updatedAt: number;
};

let slowCache: SlowCache = {
  processes: [],
  disks: [],
  localIps: [],
  gpu: [],
  updatedAt: 0,
};

let lastFast: {
  cpu: SystemMetrics['cpu'];
  memory: SystemMetrics['memory'];
  network: SystemMetrics['network'];
} | null = null;

/** Slow collectors (processes, GPU, disks, …) — keep sparse to stay lightweight. */
const SLOW_TTL = 30_000;

/** Widget types present on the active preset — gates expensive collectors. */
let activeWidgetTypes = new Set<string>();

export function setActiveWidgetTypes(types: Iterable<string>): void {
  activeWidgetTypes = new Set(types);
}

/** True only when a matching widget is on the board (empty board = skip). */
function wants(...types: string[]): boolean {
  return types.some((t) => activeWidgetTypes.has(t));
}

function needsDiskIO(): boolean {
  return wants('disk-io', 'sensors', 'alerts');
}

function needsCpuSpeed(): boolean {
  return wants('cpu-freq', 'sensors');
}

function needsGpu(): boolean {
  return wants('gpu', 'temps', 'sensors');
}

function needsFans(): boolean {
  return wants('fans', 'sensors');
}

function needsProcesses(): boolean {
  return wants('processes', 'top-memory', 'alerts');
}

function needsWifi(): boolean {
  return wants('wifi');
}

function needsBattery(): boolean {
  return wants('battery');
}

function needsDisks(): boolean {
  return wants('disk', 'disk-io', 'sensors', 'alerts');
}

function needsSystemInfo(): boolean {
  return wants('system-info', 'uptime');
}

function needsLocalIps(): boolean {
  return wants('ips', 'ip', 'network-info');
}

function needsPublicIp(): boolean {
  return wants('ips', 'ip', 'public-ip', 'network-info');
}

function needsCpuTemp(): boolean {
  // WMI temperature is expensive — only when a temps/sensors widget asks for it
  return wants('temps', 'sensors', 'cpu-temp');
}

function needsNetworkStats(): boolean {
  return wants(
    'network-speed',
    'net-graph',
    'data-usage',
    'net-adapters',
    'bandwidth-cap',
    'alerts',
  );
}

function needsSwap(): boolean {
  return wants('swap');
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise.then((v) => v as T | null),
      new Promise<T | null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchPublicIp(): Promise<string | undefined> {
  if (!needsPublicIp()) return publicIpCache.ip;
  const now = Date.now();
  if (publicIpCache.ip && now - publicIpCache.fetchedAt < PUBLIC_IP_TTL) {
    return publicIpCache.ip;
  }
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return publicIpCache.ip;
    const data = (await res.json()) as { ip: string };
    publicIpCache = { ip: data.ip, fetchedAt: now };
    return data.ip;
  } catch {
    return publicIpCache.ip;
  }
}

async function refreshSlowMetrics(): Promise<void> {
  const now = Date.now();
  if (now - slowCache.updatedAt < SLOW_TTL && slowCache.updatedAt > 0) return;

  const first = slowCache.updatedAt === 0;
  const t = (ms: number) => (first ? Math.max(ms * 4, 8000) : ms);

  const [
    graphics,
    fsSize,
    wifiConnections,
    battery,
    processes,
    osInfo,
    system,
    networkInterfaces,
    disksIO,
    cpuCurrentSpeed,
    fanData,
  ] = await Promise.all([
    needsGpu() ? withTimeout(si.graphics(), t(4000)) : Promise.resolve(null),
    needsDisks() ? withTimeout(si.fsSize(), t(5000)) : Promise.resolve(null),
    needsWifi()
      ? withTimeout(
          si.wifiConnections().catch(() => [] as si.Systeminformation.WifiConnectionData[]),
          t(3000),
        )
      : Promise.resolve(null),
    needsBattery()
      ? withTimeout(
          si.battery().catch(() => null),
          t(2500),
        )
      : Promise.resolve(null),
    needsProcesses() ? withTimeout(si.processes(), t(8000)) : Promise.resolve(null),
    needsSystemInfo() ? withTimeout(si.osInfo(), t(5000)) : Promise.resolve(null),
    needsSystemInfo() ? withTimeout(si.system(), t(3000)) : Promise.resolve(null),
    needsLocalIps() ? withTimeout(si.networkInterfaces(), t(3000)) : Promise.resolve(null),
    needsDiskIO()
      ? withTimeout(
          si.disksIO().catch(() => null),
          t(3000),
        )
      : Promise.resolve(null),
    needsCpuSpeed()
      ? withTimeout(
          si.cpuCurrentSpeed().catch(() => null),
          t(2500),
        )
      : Promise.resolve(null),
    needsFans()
      ? withTimeout(
          collectFans().catch(() => [] as { label: string; rpm: number }[]),
          t(3000),
        )
      : Promise.resolve(null),
  ]);

  const time = si.time();

  const wifiList = wifiConnections ?? [];
  const wifi = wifiList[0]
    ? {
        ssid: wifiList[0].ssid || 'Unknown',
        signalLevel: Number(wifiList[0].signalLevel) || 0,
        quality: Number(wifiList[0].quality) || 0,
        frequency: wifiList[0].frequency ? Number(wifiList[0].frequency) : undefined,
      }
    : needsWifi()
      ? slowCache.wifi
      : undefined;

  const ifaces = networkInterfaces ?? [];
  const localIps = (Array.isArray(ifaces) ? ifaces : [])
    .filter((iface) => !iface.internal && iface.ip4)
    .map((iface) => iface.ip4);

  const procList = processes?.list ?? [];
  const topProcs =
    procList.length > 0
      ? [...procList]
          .sort((a, b) => b.cpu - a.cpu)
          .slice(0, 20)
          .map((p) => ({
            pid: p.pid,
            name: p.name,
            cpu: Math.round(p.cpu * 10) / 10,
            mem: Math.round(p.mem * 10) / 10,
            memRss: p.memRss,
          }))
      : needsProcesses()
        ? slowCache.processes
        : [];

  const graphicsOk = graphics != null;
  const controllers = graphics?.controllers ?? [];
  const rawGpus = controllers
    .filter((c) => c.model)
    .map((c) => ({
      model: c.model || 'GPU',
      // si omits utilizationGpu when nvidia-smi reports 0 (falsy check) — treat as unknown here
      utilization: typeof c.utilizationGpu === 'number' ? c.utilizationGpu : 0,
      memoryUsed: c.memoryUsed ?? undefined,
      memoryTotal: c.memoryTotal ?? c.vram ?? undefined,
      temperature: c.temperatureGpu ?? undefined,
    }));

  const gpus =
    needsGpu() && rawGpus.length
      ? await enrichGpuMetrics(rawGpus, { enrich: true })
      : needsGpu()
        ? []
        : (slowCache.gpu ?? []);

  const disks =
    fsSize && fsSize.length
      ? fsSize.map((d) => ({
          fs: d.fs,
          mount: d.mount,
          type: d.type,
          size: d.size,
          used: d.used,
          available: d.available,
          percent: Math.round(d.use * 10) / 10,
        }))
      : needsDisks()
        ? slowCache.disks
        : [];

  slowCache = {
    processes: topProcs,
    wifi,
    // Always expose an array: [] when the host has no GPU (e.g. CI VMs).
    // On graphics() timeout, keep the previous sample.
    gpu: needsGpu() ? (graphicsOk ? gpus : (slowCache.gpu ?? [])) : [],
    disks,
    battery: battery
      ? {
          hasBattery: battery.hasBattery,
          isCharging: battery.isCharging,
          percent: battery.percent,
          timeRemaining: battery.timeRemaining > 0 ? battery.timeRemaining : undefined,
        }
      : needsBattery()
        ? slowCache.battery
        : undefined,
    system: osInfo
      ? {
          manufacturer: system?.manufacturer || slowCache.system?.manufacturer || '',
          model: system?.model || slowCache.system?.model || '',
          hostname: osInfo.hostname || slowCache.system?.hostname || 'unknown',
          platform: osInfo.platform || slowCache.system?.platform || 'unknown',
          release: osInfo.release || slowCache.system?.release || '',
          arch: osInfo.arch || slowCache.system?.arch || '',
          uptime: time.uptime,
        }
      : slowCache.system
        ? { ...slowCache.system, uptime: time.uptime }
        : needsSystemInfo()
          ? {
              manufacturer: '',
              model: '',
              hostname: 'unknown',
              platform: 'unknown',
              release: '',
              arch: '',
              uptime: time.uptime,
            }
          : slowCache.system,
    localIps: localIps.length ? localIps : needsLocalIps() ? slowCache.localIps : [],
    fans:
      fanData && Array.isArray(fanData) && fanData.length
        ? fanData.map((f) => ({
            label: f.label || 'Fan',
            rpm: Math.round(f.rpm),
          }))
        : needsFans()
          ? slowCache.fans || []
          : [],
    diskIO: disksIO
      ? {
          rIO_sec: disksIO.rIO_sec ?? undefined,
          wIO_sec: disksIO.wIO_sec ?? undefined,
          rBytesPerSec: Number((disksIO as { r_sec?: number }).r_sec) || undefined,
          wBytesPerSec: Number((disksIO as { w_sec?: number }).w_sec) || undefined,
        }
      : needsDiskIO()
        ? slowCache.diskIO
        : undefined,
    cpuSpeed: cpuCurrentSpeed
      ? {
          speed: cpuCurrentSpeed.avg,
          speedMin: cpuCurrentSpeed.min,
          speedMax: cpuCurrentSpeed.max,
        }
      : needsCpuSpeed()
        ? slowCache.cpuSpeed
        : undefined,
    updatedAt: Date.now(),
  };
}

export async function collectMetrics(): Promise<SystemMetrics> {
  const slowPromise = refreshSlowMetrics();
  if (slowCache.updatedAt === 0) {
    await slowPromise;
  }

  // CPU + RAM via os.* (cheap). Only hit systeminformation for network / temp / swap when needed.
  const cpuSample = sampleCpu();
  const memSample = sampleMem();

  const [networkStats, cpuTemp, swapMem] = await Promise.all([
    needsNetworkStats() ? withTimeout(si.networkStats(), 3000) : Promise.resolve(null),
    needsCpuTemp()
      ? withTimeout(
          si.cpuTemperature().catch(() => ({ main: undefined as number | undefined })),
          1500,
        )
      : Promise.resolve(null),
    needsSwap() ? withTimeout(si.mem(), 3000) : Promise.resolve(null),
  ]);

  const publicIp = await fetchPublicIp();

  const cpu = {
    currentLoad: cpuSample.currentLoad,
    cores: cpuSample.cores,
    temperature: cpuTemp?.main ?? lastFast?.cpu.temperature,
    speed: slowCache.cpuSpeed?.speed,
    speedMin: slowCache.cpuSpeed?.speedMin,
    speedMax: slowCache.cpuSpeed?.speedMax,
  };

  const memory = {
    total: memSample.total,
    used: memSample.used,
    free: memSample.free,
    percent: memSample.percent,
    swapTotal: swapMem?.swaptotal ?? lastFast?.memory.swapTotal ?? 0,
    swapUsed: swapMem?.swapused ?? lastFast?.memory.swapUsed ?? 0,
    swapFree: swapMem?.swapfree ?? lastFast?.memory.swapFree ?? 0,
    swapPercent:
      swapMem && swapMem.swaptotal > 0
        ? Math.round((swapMem.swapused / swapMem.swaptotal) * 1000) / 10
        : (lastFast?.memory.swapPercent ?? 0),
  };

  const network = networkStats
    ? networkStats.map((n) => ({
        iface: n.iface,
        rxSec: Math.max(0, n.rx_sec || 0),
        txSec: Math.max(0, n.tx_sec || 0),
        rxBytes: n.rx_bytes || 0,
        txBytes: n.tx_bytes || 0,
        operstate: n.operstate || 'unknown',
      }))
    : (lastFast?.network ?? []);

  lastFast = { cpu, memory, network };

  return {
    timestamp: Date.now(),
    cpu,
    memory,
    gpu: slowCache.gpu ?? [],
    disks: slowCache.disks,
    diskIO: slowCache.diskIO,
    network,
    wifi: slowCache.wifi,
    battery: slowCache.battery,
    fans: slowCache.fans,
    processes: slowCache.processes,
    system: slowCache.system || {
      manufacturer: '',
      model: '',
      hostname: 'unknown',
      platform: 'unknown',
      release: '',
      arch: '',
      uptime: 0,
    },
    ips: {
      local: slowCache.localIps,
      public: publicIp,
    },
  };
}
