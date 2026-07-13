import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { SystemMetrics } from '@pulsedeck/shared';

const execFileAsync = promisify(execFile);

export type GpuMetric = NonNullable<SystemMetrics['gpu']>[number];

type NvidiaRow = {
  name: string;
  utilization: number;
  memoryUsed: number;
  memoryTotal: number;
  temperature?: number;
};

function isNvidia(model: string): boolean {
  return /nvidia|geforce|quadro|rtx|gtx|tesla/i.test(model);
}

function isAmd(model: string): boolean {
  return /amd|radeon|rx\s?\d/i.test(model);
}

function isIntel(model: string): boolean {
  return /intel|uhd|iris|arc/i.test(model);
}

function gpuRank(model: string): number {
  if (isNvidia(model) || isAmd(model)) return 0;
  if (isIntel(model)) return 2;
  return 1;
}

async function readSysfsNumber(path: string): Promise<number | null> {
  try {
    const raw = (await readFile(path, 'utf8')).trim();
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Linux AMD/Intel util from DRM sysfs (no extra tools required). */
async function fetchLinuxSysfsGpuUtils(): Promise<{ amd: number[]; intel: number[] }> {
  const amd: number[] = [];
  const intel: number[] = [];
  if (process.platform !== 'linux') return { amd, intel };
  try {
    const cards = await readdir('/sys/class/drm');
    for (const name of cards) {
      if (!/^card\d+$/.test(name)) continue;
      const base = join('/sys/class/drm', name);
      const busy =
        (await readSysfsNumber(join(base, 'device', 'gpu_busy_percent'))) ??
        (await readSysfsNumber(join(base, 'gt', 'gt0', 'busy'))) ??
        (await readSysfsNumber(join(base, 'gt', 'gt1', 'busy')));
      if (busy == null) continue;
      const clamped = Math.max(0, Math.min(100, busy));
      // Heuristic: AMD exposes gpu_busy_percent on device/; Intel often gt/*/busy
      const hasAmdBusy = (await readSysfsNumber(join(base, 'device', 'gpu_busy_percent'))) != null;
      if (hasAmdBusy) amd.push(clamped);
      else intel.push(clamped);
    }
  } catch {
    /* ignore */
  }
  return { amd, intel };
}

async function fetchNvidiaSmi(): Promise<NvidiaRow[]> {
  try {
    const { stdout } = await execFileAsync(
      'nvidia-smi',
      [
        '--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu',
        '--format=csv,noheader,nounits',
      ],
      { timeout: 5000, windowsHide: true, encoding: 'utf8' },
    );
    return stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length < 4) return null;
        const utilization = Number(parts[1]);
        const memoryUsed = Number(parts[2]);
        const memoryTotal = Number(parts[3]);
        const temperature = parts[4] != null && parts[4] !== '' ? Number(parts[4]) : undefined;
        return {
          name: parts[0],
          utilization: Number.isFinite(utilization) ? utilization : 0,
          memoryUsed: Number.isFinite(memoryUsed) ? memoryUsed : 0,
          memoryTotal: Number.isFinite(memoryTotal) ? memoryTotal : 0,
          ...(Number.isFinite(temperature) ? { temperature } : {}),
        } as NvidiaRow;
      })
      .filter((r): r is NvidiaRow => r !== null);
  } catch {
    return [];
  }
}

/** Windows Task Manager–style util: max engine-type sum per GPU LUID. */
async function fetchWindowsGpuUtilsByLuid(): Promise<number[]> {
  if (process.platform !== 'win32') return [];
  const script = `
$ErrorActionPreference = 'Stop'
try {
  $samples = (Get-Counter '\\GPU Engine(*)\\Utilization Percentage').CounterSamples
  $by = @{}
  foreach ($s in $samples) {
    if ($s.InstanceName -notmatch 'luid_0x([0-9a-fA-F]+)_0x([0-9a-fA-F]+)_phys_\\d+_eng_\\d+_engtype_(\\w+)') { continue }
    $luid = $Matches[1] + '_' + $Matches[2]
    $eng = $Matches[3]
    if (-not $by.ContainsKey($luid)) { $by[$luid] = @{} }
    if (-not $by[$luid].ContainsKey($eng)) { $by[$luid][$eng] = [double]0 }
    $by[$luid][$eng] += [double]$s.CookedValue
  }
  $out = @()
  foreach ($luid in $by.Keys) {
    $max = 0.0
    foreach ($v in $by[$luid].Values) { if ($v -gt $max) { $max = $v } }
    if ($max -gt 100) { $max = 100 }
    $out += [math]::Round($max, 1)
  }
  if ($out.Count -eq 0) { '[]' } else { ($out | ConvertTo-Json -Compress) }
} catch {
  '[]'
}
`.trim();

  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { timeout: 12000, windowsHide: true, encoding: 'utf8' },
    );
    const raw = stdout.trim();
    if (!raw || raw === '[]') return [];
    const parsed = JSON.parse(raw) as number | number[];
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map((n) => (Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0));
  } catch {
    return [];
  }
}

function matchNvidia(gpu: GpuMetric, rows: NvidiaRow[], used: Set<number>): NvidiaRow | undefined {
  const model = gpu.model.toLowerCase();
  let best = -1;
  let bestScore = -1;
  for (let i = 0; i < rows.length; i++) {
    if (used.has(i)) continue;
    const name = rows[i].name.toLowerCase();
    let score = 0;
    if (name === model || model.includes(name) || name.includes(model.replace(/^nvidia\s+/i, ''))) {
      score = 100;
    } else {
      const tokens = name.split(/\s+/).filter((t) => t.length > 2);
      score = tokens.filter((t) => model.includes(t)).length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  if (best < 0 || bestScore <= 0) {
    // Fall back: first unused NVIDIA row for NVIDIA-looking controllers
    if (!isNvidia(gpu.model)) return undefined;
    for (let i = 0; i < rows.length; i++) {
      if (!used.has(i)) {
        best = i;
        break;
      }
    }
  }
  if (best < 0) return undefined;
  used.add(best);
  return rows[best];
}

/**
 * Enrich si.graphics() controllers with real utilization.
 * systeminformation skips nvidia util when it is 0, and never fills Intel util on Windows.
 * Call only when a GPU/temps/sensors widget is on the board — nvidia-smi + PDH are expensive.
 */
export async function enrichGpuMetrics(
  base: GpuMetric[],
  options: { enrich?: boolean; windowsCounters?: boolean } = {},
): Promise<GpuMetric[]> {
  const gpus = base.map((g) => ({ ...g }));
  if (!gpus.length) return gpus;

  // enrich defaults true when called; callers gate invocation. windowsCounters follows enrich.
  const enrich = options.enrich !== false;
  if (!enrich) {
    gpus.sort((a, b) => {
      const r = gpuRank(a.model) - gpuRank(b.model);
      if (r !== 0) return r;
      return (b.utilization || 0) - (a.utilization || 0);
    });
    return gpus.map((g) => ({
      ...g,
      utilization: Math.round((g.utilization || 0) * 10) / 10,
    }));
  }

  const wantWinCounters = (options.windowsCounters ?? true) && process.platform === 'win32';
  const wantLinuxSysfs = process.platform === 'linux';
  const [nvidiaRows, luidUtils, linuxUtils] = await Promise.all([
    fetchNvidiaSmi(),
    wantWinCounters ? fetchWindowsGpuUtilsByLuid() : Promise.resolve([] as number[]),
    wantLinuxSysfs
      ? fetchLinuxSysfsGpuUtils()
      : Promise.resolve({ amd: [] as number[], intel: [] as number[] }),
  ]);

  const usedNvidia = new Set<number>();
  const nvidiaUtils: number[] = [];

  for (const gpu of gpus) {
    const row = matchNvidia(gpu, nvidiaRows, usedNvidia);
    if (!row) continue;
    // Always set util (including 0) — si omits falsy 0
    gpu.utilization = row.utilization;
    nvidiaUtils.push(row.utilization);
    if (row.memoryUsed != null) gpu.memoryUsed = row.memoryUsed;
    if (row.memoryTotal != null) gpu.memoryTotal = row.memoryTotal;
    if (row.temperature != null) gpu.temperature = row.temperature;
  }

  // Linux AMD / Intel from sysfs
  let amdIdx = 0;
  let intelIdx = 0;
  for (const gpu of gpus) {
    if (isNvidia(gpu.model) && nvidiaRows.length) continue;
    if (gpu.utilization && gpu.utilization > 0) continue;
    if (isAmd(gpu.model) && amdIdx < linuxUtils.amd.length) {
      gpu.utilization = linuxUtils.amd[amdIdx++];
    } else if (isIntel(gpu.model) && intelIdx < linuxUtils.intel.length) {
      gpu.utilization = linuxUtils.intel[intelIdx++];
    }
  }

  // Assign Windows LUID utils to non-NVIDIA adapters (and any still missing util)
  let remaining = [...luidUtils];
  for (const nUtil of nvidiaUtils) {
    if (!remaining.length) break;
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = Math.abs(remaining[i] - nUtil);
      if (d < bestDiff) {
        bestDiff = d;
        bestIdx = i;
      }
    }
    // Only peel off a LUID as "nvidia" when it looks related (or nvidia reported busy)
    if (nUtil > 1 || bestDiff <= 5) {
      remaining.splice(bestIdx, 1);
    }
  }
  remaining.sort((a, b) => b - a);

  let ri = 0;
  for (const gpu of gpus) {
    if (isNvidia(gpu.model) && nvidiaRows.length) continue;
    if (ri >= remaining.length) break;
    // Prefer Windows counter when si left util at 0/undefined
    if (!gpu.utilization || gpu.utilization === 0) {
      gpu.utilization = remaining[ri++];
    }
  }

  // Discrete first so the ring isn't stuck on Intel iGPU
  gpus.sort((a, b) => {
    const r = gpuRank(a.model) - gpuRank(b.model);
    if (r !== 0) return r;
    return (b.utilization || 0) - (a.utilization || 0);
  });

  return gpus.map((g) => ({
    ...g,
    utilization: Math.round((g.utilization || 0) * 10) / 10,
  }));
}
