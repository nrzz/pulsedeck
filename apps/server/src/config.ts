import fs from 'node:fs';
import path from 'node:path';
import type { AppConfig, LayoutPreset, WidgetInstance } from '@pulsedeck/shared';
import { createDefaultConfig, createDesktopPreset } from '@pulsedeck/shared';

let DATA_DIR = '';
let CONFIG_PATH = '';

const NOTES_MAX = 32_000;

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

function isE2ePolluted(preset: LayoutPreset): boolean {
  if (preset.id === 'e2e-all') return true;
  return (preset.widgets ?? []).some((w) => /-e2e$/i.test(w.id));
}

function isPollutedDesktop(preset: LayoutPreset): boolean {
  if (preset.id !== 'desktop') return false;
  const widgets = preset.widgets ?? [];
  return widgets.length > 12 || widgets.some((w) => /-e2e$/i.test(w.id));
}

/** Strip clipboard history blobs from persisted settings (edge case: huge paste history). */
function scrubWidgetSettings(widgets: WidgetInstance[]): WidgetInstance[] {
  return widgets.map((w) => {
    if (w.type !== 'clipboard' || !w.settings || !('history' in w.settings)) return w;
    const { history: _drop, ...rest } = w.settings as Record<string, unknown>;
    return { ...w, settings: rest };
  });
}

function scrubPreset(preset: LayoutPreset): LayoutPreset {
  return {
    ...preset,
    widgets: scrubWidgetSettings(preset.widgets ?? []),
  };
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
    let dirty = false;

    let presets = parsed.presets?.length ? [...parsed.presets] : [...defaults.presets];

    // Drop disposable e2e boards entirely
    const beforeLen = presets.length;
    presets = presets.filter((p) => !isE2ePolluted(p) || p.id === 'desktop');
    if (presets.length !== beforeLen) dirty = true;

    if (!presets.some((p) => p.id === 'desktop')) {
      presets.push(createDesktopPreset());
      dirty = true;
    }

    presets = presets.map((p) => {
      if (isPollutedDesktop(p)) {
        dirty = true;
        return createDesktopPreset();
      }
      const scrubbed = scrubPreset(p);
      if (JSON.stringify(scrubbed.widgets) !== JSON.stringify(p.widgets)) dirty = true;
      return scrubbed;
    });

    let activePresetId = parsed.activePresetId || defaults.activePresetId;
    if (!presets.some((p) => p.id === activePresetId)) {
      activePresetId = presets.some((p) => p.id === 'desktop')
        ? 'desktop'
        : (presets[0]?.id ?? 'desktop');
      dirty = true;
    }

    const notes =
      typeof parsed.notes === 'string' && parsed.notes.length > NOTES_MAX
        ? parsed.notes.slice(0, NOTES_MAX)
        : (parsed.notes ?? '');
    if (typeof parsed.notes === 'string' && parsed.notes.length > NOTES_MAX) dirty = true;

    const config: AppConfig = {
      ...defaults,
      ...parsed,
      notes,
      theme: { ...defaults.theme, ...parsed.theme },
      shell: { ...defaults.shell, ...(parsed.shell ?? {}) },
      apiKeys: { ...defaults.apiKeys, ...parsed.apiKeys },
      presets,
      quickLinks: parsed.quickLinks ?? defaults.quickLinks,
      activePresetId,
    };

    if (dirty) {
      saveConfig(config);
    }
    return config;
  } catch {
    const defaults = createDefaultConfig();
    saveConfig(defaults);
    return defaults;
  }
}

export function saveConfig(config: AppConfig): void {
  ensureDataDir();
  const notes =
    typeof config.notes === 'string' && config.notes.length > NOTES_MAX
      ? config.notes.slice(0, NOTES_MAX)
      : config.notes;
  const next = {
    ...config,
    notes,
    presets: (config.presets ?? []).map(scrubPreset).filter((p) => p.id !== 'e2e-all'),
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf-8');
}

export function getConfigPath(): string {
  ensurePathsInitialized();
  return CONFIG_PATH;
}

export function getDataDir(): string {
  ensurePathsInitialized();
  return DATA_DIR;
}
