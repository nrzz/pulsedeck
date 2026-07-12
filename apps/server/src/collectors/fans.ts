import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type FanReading = { label: string; rpm: number };

/** Collect fan RPM from Linux hwmon or `sensors -j` when available. */
export async function collectFans(): Promise<FanReading[]> {
  if (process.platform === 'linux') {
    const fromHwmon = await readHwmonFans();
    if (fromHwmon.length) return fromHwmon;
    return readSensorsJsonFans();
  }
  return [];
}

async function readHwmonFans(): Promise<FanReading[]> {
  const out: FanReading[] = [];
  try {
    const hwmons = await readdir('/sys/class/hwmon');
    for (const dir of hwmons) {
      const base = join('/sys/class/hwmon', dir);
      let chip = dir;
      try {
        chip = (await readFile(join(base, 'name'), 'utf8')).trim() || dir;
      } catch {
        // ignore
      }
      const files = await readdir(base);
      for (const f of files) {
        const m = /^fan(\d+)_input$/.exec(f);
        if (!m) continue;
        try {
          const rpm = Number((await readFile(join(base, f), 'utf8')).trim());
          if (!Number.isFinite(rpm) || rpm <= 0) continue;
          let label = `Fan ${m[1]}`;
          try {
            label = (await readFile(join(base, `fan${m[1]}_label`), 'utf8')).trim() || label;
          } catch {
            // ignore
          }
          out.push({ label: `${chip} ${label}`, rpm: Math.round(rpm) });
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
  return out;
}

async function readSensorsJsonFans(): Promise<FanReading[]> {
  try {
    const { stdout } = await execFileAsync('sensors', ['-j'], { timeout: 4000 });
    const data = JSON.parse(stdout) as Record<string, Record<string, unknown>>;
    const out: FanReading[] = [];
    for (const [chip, block] of Object.entries(data)) {
      if (!block || typeof block !== 'object') continue;
      for (const [key, val] of Object.entries(block)) {
        if (!val || typeof val !== 'object') continue;
        const fanIn =
          (val as Record<string, number>)[`fan1_input`] ??
          (val as Record<string, number>)[`fan2_input`] ??
          Object.entries(val as Record<string, number>).find(([k]) => /fan\d+_input/.test(k))?.[1];
        if (typeof fanIn === 'number' && fanIn > 0) {
          out.push({ label: `${chip} ${key}`, rpm: Math.round(fanIn) });
        }
      }
    }
    return out;
  } catch {
    return [];
  }
}
