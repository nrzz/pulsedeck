import type { SystemMetrics } from '@pulsedeck/shared';

/**
 * Strip metrics fields the active board does not need before WebSocket broadcast.
 * Cuts JSON size, renderer parse cost, and retained heap on large boards.
 */
export function slimMetricsForBoard(
  metrics: SystemMetrics,
  types: Iterable<string>,
): SystemMetrics {
  const active = types instanceof Set ? types : new Set(types);
  const wants = (...keys: string[]) => keys.some((k) => active.has(k));

  const needCpu = wants('cpu', 'cpu-freq', 'temps', 'sensors', 'alerts');
  const needRam = wants('ram', 'swap', 'alerts', 'top-memory');
  const needGpu = wants('gpu', 'temps', 'sensors');
  const needDisk = wants('disk', 'disk-io', 'sensors', 'alerts');
  const needNet = wants(
    'network-speed',
    'net-graph',
    'data-usage',
    'net-adapters',
    'bandwidth-cap',
    'alerts',
  );
  const needProcs = wants('processes', 'top-memory', 'alerts');
  const needSystem = wants('system-info', 'uptime');
  const needIps = wants('ips', 'ip', 'public-ip', 'network-info');

  return {
    timestamp: metrics.timestamp,
    cpu: {
      currentLoad: metrics.cpu.currentLoad,
      cores: needCpu ? (metrics.cpu.cores || []).slice(0, 8) : [],
      temperature: needCpu ? metrics.cpu.temperature : undefined,
      speed: wants('cpu-freq', 'sensors') ? metrics.cpu.speed : undefined,
      speedMin: wants('cpu-freq', 'sensors') ? metrics.cpu.speedMin : undefined,
      speedMax: wants('cpu-freq', 'sensors') ? metrics.cpu.speedMax : undefined,
    },
    memory: needRam
      ? metrics.memory
      : {
          total: metrics.memory.total,
          used: metrics.memory.used,
          free: metrics.memory.free,
          percent: metrics.memory.percent,
          swapTotal: 0,
          swapUsed: 0,
          swapFree: 0,
          swapPercent: 0,
        },
    gpu: needGpu ? (metrics.gpu || []).slice(0, 4) : [],
    disks: needDisk ? (metrics.disks || []).slice(0, 8) : [],
    diskIO: wants('disk-io', 'sensors', 'alerts') ? metrics.diskIO : undefined,
    network: needNet ? (metrics.network || []).slice(0, 4) : [],
    wifi: wants('wifi') ? metrics.wifi : undefined,
    battery: wants('battery') ? metrics.battery : undefined,
    fans: wants('fans', 'sensors') ? (metrics.fans || []).slice(0, 8) : [],
    processes: needProcs ? (metrics.processes || []).slice(0, 8) : [],
    system: needSystem
      ? metrics.system
      : {
          manufacturer: '',
          model: '',
          hostname: metrics.system?.hostname || 'unknown',
          platform: metrics.system?.platform || 'unknown',
          release: '',
          arch: '',
          uptime: metrics.system?.uptime ?? 0,
        },
    ips: needIps
      ? {
          local: (metrics.ips?.local || []).slice(0, 4),
          public: metrics.ips?.public,
        }
      : { local: [] },
  };
}
