import fs from 'node:fs';
import path from 'node:path';
import type { AppConfig } from '@pulsedeck/shared';
import { createDefaultConfig, createDesktopPreset } from '@pulsedeck/shared';

let DATA_DIR = '';
let CONFIG_PATH = '';

function resolveDefaultDataDir(): string {
  if (process.env.PULSEDECK_DATA_DIR) {
    return path.resolve(process.env.PULSEDECK_DATA_DIR);
  }
  // Dev/CLI fallback (Electron always passes dataDir / PULSEDECK_DATA_DIR)
  return path.resolve(process.cwd(), 'apps', 'server', 'data');
}

function ensurePathsInitialized() {
  if (!DATA_DIR) {
    DATA_DIR = resolveDefaultDataDir();
    CONFIG_PATH = path.join(DATA_DIR, 'config.json');
  }
}

export function setDataDir(dir: string): void {
  DATA_DIR = path.resolve(dir);
  CONFIG_PATH = path.join(DATA_DIR, 'config.json');
}

function ensureDataDir() {
  ensurePathsInitialized();
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadConfig(): AppConfig {
  ensureDataDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaults = createDefaultConfig();
    saveConfig(defaults);
    return defaults;
  }
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as AppConfig;
    const defaults = createDefaultConfig();
    const presets = parsed.presets?.length ? [...parsed.presets] : [...defaults.presets];
    if (!presets.some((p) => p.id === 'desktop')) {
      presets.push(createDesktopPreset());
    }
    return {
      ...defaults,
      ...parsed,
      theme: { ...defaults.theme, ...parsed.theme },
      shell: { ...defaults.shell, ...(parsed.shell ?? {}) },
      apiKeys: { ...defaults.apiKeys, ...parsed.apiKeys },
      presets,
      quickLinks: parsed.quickLinks ?? defaults.quickLinks,
    };
  } catch {
    const defaults = createDefaultConfig();
    saveConfig(defaults);
    return defaults;
  }
}

export function saveConfig(config: AppConfig): void {
  ensureDataDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function getConfigPath(): string {
  ensurePathsInitialized();
  return CONFIG_PATH;
}

export function getDataDir(): string {
  ensurePathsInitialized();
  return DATA_DIR;
}
