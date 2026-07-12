import { useRef, useState } from 'react';
import { Download, Upload, X } from 'lucide-react';
import type { AppConfig, LayoutPreset } from '@pulsedeck/shared';
import { createDefaultConfig } from '@pulsedeck/shared';
import { useDashboard } from '../store/dashboard';
import { persistConfig } from '../hooks/useWebSocket';
import { useToast } from '../store/toast';
import { uid } from '../lib/utils';
import { isWidgetShell } from '../lib/shell';

const ACCENTS = ['#14b8a6', '#06b6d4', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899'];

export function SettingsPanel() {
  const open = useDashboard((s) => s.settingsOpen);
  const setSettingsOpen = useDashboard((s) => s.setSettingsOpen);
  const config = useDashboard((s) => s.config);
  const setConfig = useDashboard((s) => s.setConfig);
  const applyTheme = useDashboard((s) => s.applyTheme);
  const showToast = useToast((s) => s.show);
  const fileRef = useRef<HTMLInputElement>(null);
  const [presetName, setPresetName] = useState('');
  const widgetShell = isWidgetShell();

  if (!open) return null;

  const patch = async (partial: Partial<AppConfig>) => {
    const next: AppConfig = {
      ...config,
      ...partial,
      theme: { ...config.theme, ...partial.theme },
      shell: { ...config.shell, ...partial.shell },
      apiKeys: { ...config.apiKeys, ...partial.apiKeys },
    };
    setConfig(next);
    applyTheme();
    await persistConfig(next);
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pulsedeck-config.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Config exported');
  };

  const importConfig = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AppConfig;
      const next = { ...createDefaultConfig(), ...parsed };
      setConfig(next);
      applyTheme();
      await persistConfig(next);
      showToast('Config imported');
    } catch {
      showToast('Invalid config file');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setSettingsOpen(false)}
        aria-label="Close settings"
      />
      <aside className="relative w-full max-w-md h-full glass-card rounded-none border-y-0 border-r-0 overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/5 bg-surface-2/80 backdrop-blur">
          <h2 className="font-semibold">Settings</h2>
          <button type="button" className="btn !p-2" onClick={() => setSettingsOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <section className="space-y-3">
            <h3 className="widget-title">Appearance</h3>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`btn flex-1 justify-center capitalize ${config.theme.mode === mode ? 'bg-accent/20 border-accent/40' : ''}`}
                  onClick={() => patch({ theme: { ...config.theme, mode } })}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div>
              <div className="text-xs text-ink-muted mb-2">Accent</div>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${config.theme.accent === c ? 'border-white' : 'border-transparent'}`}
                    style={{ background: c }}
                    onClick={() => patch({ theme: { ...config.theme, accent: c } })}
                  />
                ))}
                <input
                  type="color"
                  value={config.theme.accent}
                  className="w-8 h-8 rounded-full overflow-hidden cursor-pointer bg-transparent"
                  onChange={(e) => patch({ theme: { ...config.theme, accent: e.target.value } })}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-ink-muted mb-1">
                <span>Card opacity</span>
                <span>{Math.round(config.theme.cardOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1}
                step={0.05}
                value={config.theme.cardOpacity}
                className="w-full accent-[rgb(var(--accent))]"
                onChange={(e) =>
                  patch({ theme: { ...config.theme, cardOpacity: Number(e.target.value) } })
                }
              />
            </div>
            <div className="flex gap-2">
              {(['comfy', 'compact'] as const).map((density) => (
                <button
                  key={density}
                  type="button"
                  className={`btn flex-1 justify-center capitalize ${config.theme.density === density ? 'bg-accent/20 border-accent/40' : ''}`}
                  onClick={() => patch({ theme: { ...config.theme, density } })}
                >
                  {density}
                </button>
              ))}
            </div>
          </section>

          {widgetShell && (
            <section className="space-y-3" data-testid="widget-settings">
              <h3 className="widget-title">Widget board</h3>
              <p className="text-xs text-ink-muted">
                Tuned for the desktop widget shell. Tray: lock, autostart, Ctrl+Alt+P to show/hide.
              </p>
              <div>
                <div className="flex justify-between text-xs text-ink-muted mb-1">
                  <span>Board glass</span>
                  <span>{Math.round((config.shell?.boardOpacity ?? 0.92) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.35}
                  max={1}
                  step={0.05}
                  value={config.shell?.boardOpacity ?? 0.92}
                  className="w-full accent-[rgb(var(--accent))]"
                  data-testid="board-opacity"
                  onChange={(e) =>
                    patch({
                      shell: {
                        ...config.shell,
                        boardOpacity: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface-3/40 px-3 py-2.5 text-sm cursor-pointer">
                <span>Hide toolbar when locked</span>
                <input
                  type="checkbox"
                  className="accent-[rgb(var(--accent))] w-4 h-4"
                  checked={config.shell?.hideToolbarWhenLocked ?? true}
                  data-testid="hide-toolbar-locked"
                  onChange={(e) =>
                    patch({
                      shell: {
                        ...config.shell,
                        hideToolbarWhenLocked: e.target.checked,
                      },
                    })
                  }
                />
              </label>
            </section>
          )}

          <section className="space-y-3">
            <h3 className="widget-title">Layout presets</h3>
            <div className="space-y-2">
              {config.presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`btn w-full justify-between ${config.activePresetId === p.id ? 'bg-accent/20 border-accent/40' : ''}`}
                  onClick={() => patch({ activePresetId: p.id })}
                >
                  <span>{p.name}</span>
                  {config.activePresetId === p.id && (
                    <span className="text-[10px] text-accent">Active</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="New preset name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
              <button
                type="button"
                className="btn-accent shrink-0"
                onClick={() => {
                  if (!presetName.trim()) return;
                  const active =
                    config.presets.find((p) => p.id === config.activePresetId) ?? config.presets[0];
                  const preset: LayoutPreset = {
                    id: uid('preset'),
                    name: presetName.trim(),
                    layout: structuredClone(active.layout),
                    widgets: structuredClone(active.widgets),
                  };
                  void patch({
                    presets: [...config.presets, preset],
                    activePresetId: preset.id,
                  });
                  setPresetName('');
                }}
              >
                Save as
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="widget-title">API keys</h3>
            <p className="text-xs text-ink-muted">
              Optional Finnhub key for stock quotes. Without it, Yahoo Finance is used.
            </p>
            <input
              className="input font-mono"
              type="password"
              placeholder="Finnhub API key"
              defaultValue={config.apiKeys.finnhub || ''}
              onBlur={(e) =>
                patch({ apiKeys: { ...config.apiKeys, finnhub: e.target.value || undefined } })
              }
            />
          </section>

          <section className="space-y-3">
            <h3 className="widget-title">Import / Export</h3>
            <div className="flex gap-2">
              <button type="button" className="btn flex-1 justify-center" onClick={exportConfig}>
                <Download size={14} /> Export JSON
              </button>
              <button
                type="button"
                className="btn flex-1 justify-center"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={14} /> Import
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importConfig(file);
                  e.target.value = '';
                }}
              />
            </div>
            <button
              type="button"
              className="btn w-full justify-center text-red-300"
              onClick={async () => {
                const defaults = createDefaultConfig();
                setConfig(defaults);
                applyTheme();
                await persistConfig(defaults);
              }}
            >
              Reset to defaults
            </button>
          </section>
        </div>
      </aside>
    </div>
  );
}
