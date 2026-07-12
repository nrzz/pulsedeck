import si from 'systeminformation';
import type { SystemMetrics } from '@pulsedeck/shared';
import { enrichGpuMetrics } from './gpu.js';

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
  updatedAt: 0,
};

let lastFast: {
  cpu: SystemMetrics['cpu'];
  memory: SystemMetrics['memory'];
  network: SystemMetrics['network'];
} | null = null;

const SLOW_TTL = 8000;

/** Widget types present on the active preset — gates expensive collectors. */
let activeWidgetTypes = new Set<string>();

export function setActiveWidgetTypes(types: Iterable<string>): void {
  activeWidgetTypes = new Set(types);
}

function needsDiskIO(): boolean {
  return (
    activeWidgetTypes.size === 0 ||
    activeWidgetTypes.has('disk-io') ||
    activeWidgetTypes.has('sensors') ||
    activeWidgetTypes.has('alerts')
  );
}

function needsCpuSpeed(): boolean {
  return (
    activeWidgetTypes.size === 0 ||
    activeWidgetTypes.has('cpu-freq') ||
    activeWidgetTypes.has('sensors')
  );
}

function needsGpuEnrich(): boolean {
  return (
    activeWidgetTypes.size === 0 ||
    activeWidgetTypes.has('gpu') ||
    activeWidgetTypes.has('temps') ||
    activeWidgetTypes.has('sensors')
  );
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
  ] = await Promise.all([
    withTimeout(si.graphics(), t(4000)),
    withTimeout(si.fsSize(), t(5000)),
    withTimeout(
      si.wifiConnections().catch(() => [] as si.Systeminformation.WifiConnectionData[]),
      t(3000),
    ),
    withTimeout(
      si.battery().catch(() => null),
      t(2500),
    ),
    withTimeout(si.processes(), t(8000)),
    withTimeout(si.osInfo(), t(5000)),
    withTimeout(si.system(), t(3000)),
    withTimeout(si.networkInterfaces(), t(3000)),
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
    : slowCache.wifi;

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
      : slowCache.processes;

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

  const gpus = rawGpus.length
    ? await enrichGpuMetrics(rawGpus, { windowsCounters: needsGpuEnrich() })
    : [];

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
      : slowCache.disks;

  slowCache = {
    processes: topProcs,
    wifi,
    gpu: gpus.length ? gpus : slowCache.gpu,
    disks,
    battery: battery
      ? {
          hasBattery: battery.hasBattery,
          isCharging: battery.isCharging,
          percent: battery.percent,
          timeRemaining: battery.timeRemaining > 0 ? battery.timeRemaining : undefined,
        }
      : slowCache.battery,
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
        : {
            manufacturer: '',
            model: '',
            hostname: 'unknown',
            platform: 'unknown',
            release: '',
            arch: '',
            uptime: time.uptime,
          },
    localIps: localIps.length ? localIps : slowCache.localIps,
    fans: slowCache.fans || [],
    diskIO: disksIO
      ? {
          rIO_sec: disksIO.rIO_sec ?? undefined,
          wIO_sec: disksIO.wIO_sec ?? undefined,
          rBytesPerSec: Number((disksIO as { r_sec?: number }).r_sec) || undefined,
          wBytesPerSec: Number((disksIO as { w_sec?: number }).w_sec) || undefined,
        }
      : slowCache.diskIO,
    cpuSpeed: cpuCurrentSpeed
      ? {
          speed: cpuCurrentSpeed.avg,
          speedMin: cpuCurrentSpeed.min,
          speedMax: cpuCurrentSpeed.max,
        }
      : slowCache.cpuSpeed,
    updatedAt: Date.now(),
  };
}

export async function collectMetrics(): Promise<SystemMetrics> {
  const slowPromise = refreshSlowMetrics();
  if (slowCache.updatedAt === 0) {
    await slowPromise;
  }

  const [currentLoad, mem, networkStats, cpuTemp] = await Promise.all([
    withTimeout(si.currentLoad(), 4000),
    withTimeout(si.mem(), 3000),
    withTimeout(si.networkStats(), 3000),
    withTimeout(
      si.cpuTemperature().catch(() => ({ main: undefined as number | undefined })),
      1500,
    ),
  ]);

  const publicIp = await fetchPublicIp();

  const cpu = currentLoad
    ? {
        currentLoad: Math.round(currentLoad.currentLoad * 10) / 10,
        cores: (currentLoad.cpus || []).map((c) => Math.round(c.load * 10) / 10),
        temperature: cpuTemp?.main ?? lastFast?.cpu.temperature,
        speed: slowCache.cpuSpeed?.speed,
        speedMin: slowCache.cpuSpeed?.speedMin,
        speedMax: slowCache.cpuSpeed?.speedMax,
      }
    : (lastFast?.cpu ?? {
        currentLoad: 0,
        cores: [],
        temperature: cpuTemp?.main,
        speed: slowCache.cpuSpeed?.speed,
      });

  const memory = mem
    ? {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        percent: Math.round((mem.used / mem.total) * 1000) / 10,
        swapTotal: mem.swaptotal,
        swapUsed: mem.swapused,
        swapFree: mem.swapfree,
        swapPercent: mem.swaptotal > 0 ? Math.round((mem.swapused / mem.swaptotal) * 1000) / 10 : 0,
      }
    : (lastFast?.memory ?? { total: 0, used: 0, free: 0, percent: 0 });

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
    gpu: slowCache.gpu,
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
