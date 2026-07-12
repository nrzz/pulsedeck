import { useEffect } from 'react';
import { createNamedPresets } from '@pulsedeck/shared';
import { Header } from './components/Header';
import { WidgetToolbar } from './components/WidgetToolbar';
import { DashboardGrid } from './components/DashboardGrid';
import { SettingsPanel } from './components/SettingsPanel';
import { AddWidgetModal } from './components/AddWidgetModal';
import { Toast } from './components/Toast';
import { useWebSocket, persistConfig } from './hooks/useWebSocket';
import { useDashboard } from './store/dashboard';
import { useToast } from './store/toast';
import { isWidgetShell } from './lib/shell';
import { cn } from './lib/utils';
import { scaleLayoutFrom12 } from './lib/layout';

export default function App() {
  useWebSocket();
  const applyTheme = useDashboard((s) => s.applyTheme);
  const connected = useDashboard((s) => s.connected);
  const hasMetrics = useDashboard((s) => !!s.metrics);
  const editMode = useDashboard((s) => s.editMode);
  const setEditMode = useDashboard((s) => s.setEditMode);
  const setAddWidgetOpen = useDashboard((s) => s.setAddWidgetOpen);
  const setSettingsOpen = useDashboard((s) => s.setSettingsOpen);
  const config = useDashboard((s) => s.config);
  const setConfig = useDashboard((s) => s.setConfig);
  const showToast = useToast((s) => s.show);
  const widgetCount = useDashboard((s) => {
    const p = s.config.presets.find((x) => x.id === s.config.activePresetId) ?? s.config.presets[0];
    return p?.widgets.length ?? 0;
  });
  const widgetShell = isWidgetShell();

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle('shell-widget', widgetShell);
    document.body.classList.toggle('shell-widget', widgetShell);
    return () => {
      document.documentElement.classList.remove('shell-widget');
      document.body.classList.remove('shell-widget');
    };
  }, [widgetShell]);

  const applyPack = async (packId: string) => {
    const pack = createNamedPresets().find((p) => p.id === packId);
    if (!pack) return;
    const cols = config.shell?.gridCols ?? 12;
    const adapted = {
      ...pack,
      layout: scaleLayoutFrom12(pack.layout, cols),
    };
    const others = config.presets.filter((p) => p.id !== pack.id);
    const next = {
      ...config,
      presets: [...others, adapted],
      activePresetId: pack.id,
      shell: { ...config.shell, gridCols: cols },
    };
    setConfig(next);
    try {
      await persistConfig(next);
      showToast(`Applied ${pack.name}`);
    } catch {
      showToast('Failed to apply pack');
    }
  };

  return (
    <div
      className={cn('app-stage min-h-full flex flex-col', widgetShell && 'app-stage-widget')}
      data-shell={widgetShell ? 'widget' : 'browser'}
      data-testid="app-stage"
    >
      {!widgetShell && <div className="ambient-orb" aria-hidden />}
      {widgetShell ? <WidgetToolbar /> : <Header />}
      <main
        className={cn(
          'flex-1 max-w-[1600px] w-full mx-auto',
          widgetShell ? 'pt-0 animate-none' : 'pt-2 sm:pt-4 animate-fade-up',
        )}
      >
        {!connected && !hasMetrics && !widgetShell && (
          <div className="mx-4 mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Connecting to PulseDeck server… If this persists, run{' '}
            <code className="font-mono">npm run dev</code>.
          </div>
        )}
        {widgetCount === 0 ? (
          <div className="mx-4 glass-card p-8 text-center max-w-lg" data-testid="empty-board-cta">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent text-xl font-semibold">
              +
            </div>
            <h2 className="text-xl font-semibold mb-1.5 tracking-tight">Your board is empty</h2>
            <p className="text-ink-muted text-sm mb-4 leading-relaxed">
              Pick a layout pack to get started, or add widgets one by one.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {createNamedPresets()
                .slice(0, 4)
                .map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    className="btn-accent !text-sm"
                    onClick={() => void applyPack(pack.id)}
                  >
                    {pack.name}
                  </button>
                ))}
              <button type="button" className="btn !text-sm" onClick={() => setSettingsOpen(true)}>
                Browse all
              </button>
            </div>
            <div className="flex justify-center gap-2">
              {!editMode && (
                <button type="button" className="btn" onClick={() => setEditMode(true)}>
                  Enter Edit mode
                </button>
              )}
              {editMode && (
                <button type="button" className="btn" onClick={() => setAddWidgetOpen(true)}>
                  Add widget
                </button>
              )}
            </div>
          </div>
        ) : (
          <DashboardGrid />
        )}
      </main>
      <SettingsPanel />
      <AddWidgetModal />
      <Toast />
    </div>
  );
}
