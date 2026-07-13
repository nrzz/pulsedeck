import os from 'node:os';

type CpuSample = { idle: number; total: number; cores: { idle: number; total: number }[] };

let prevCpu: CpuSample | null = null;

/**
 * Lightweight CPU % from os.cpus() deltas — avoids Windows WMI used by systeminformation.
 * First call after process start returns 0 until a second sample exists.
 */
export function sampleCpu(): { currentLoad: number; cores: number[] } {
  const cpus = os.cpus();
  const cores = cpus.map((c) => {
    const total = Object.values(c.times).reduce((a, b) => a + b, 0);
    return { idle: c.times.idle, total };
  });
  const idle = cores.reduce((a, c) => a + c.idle, 0);
  const total = cores.reduce((a, c) => a + c.total, 0);

  let currentLoad = 0;
  let coreLoads = cores.map(() => 0);

  if (prevCpu && total > prevCpu.total) {
    const di = idle - prevCpu.idle;
    const dt = total - prevCpu.total;
    currentLoad = Math.max(0, Math.min(100, (1 - di / dt) * 100));
    coreLoads = cores.map((c, i) => {
      const p = prevCpu!.cores[i];
      if (!p || c.total <= p.total) return 0;
      const cdt = c.total - p.total;
      const cdi = c.idle - p.idle;
      return Math.max(0, Math.min(100, (1 - cdi / cdt) * 100));
    });
  }

  prevCpu = { idle, total, cores };
  return {
    currentLoad: Math.round(currentLoad * 10) / 10,
    cores: coreLoads.map((v) => Math.round(v * 10) / 10),
  };
}

/** Lightweight RAM from os.freemem — no WMI. Swap stays 0 unless filled elsewhere. */
export function sampleMem(): {
  total: number;
  used: number;
  free: number;
  percent: number;
  swapTotal: number;
  swapUsed: number;
  swapFree: number;
  swapPercent: number;
} {
  const total = os.totalmem();
  const free = os.freemem();
  const used = Math.max(0, total - free);
  return {
    total,
    used,
    free,
    percent: total > 0 ? Math.round((used / total) * 1000) / 10 : 0,
    swapTotal: 0,
    swapUsed: 0,
    swapFree: 0,
    swapPercent: 0,
  };
}
