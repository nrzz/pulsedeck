import { useEffect } from 'react';
import { Header } from './components/Header';
import { WidgetToolbar } from './components/WidgetToolbar';
import { DashboardGrid } from './components/DashboardGrid';
import { SettingsPanel } from './components/SettingsPanel';
import { AddWidgetModal } from './components/AddWidgetModal';
import { Toast } from './components/Toast';
import { useWebSocket } from './hooks/useWebSocket';
import { useDashboard } from './store/dashboard';
import { isWidgetShell } from './lib/shell';
import { cn } from './lib/utils';

export default function App() {
  useWebSocket();
  const applyTheme = useDashboard((s) => s.applyTheme);
  const connected = useDashboard((s) => s.connected);
  const hasMetrics = useDashboard((s) => !!s.metrics);
  const editMode = useDashboard((s) => s.editMode);
  const setEditMode = useDashboard((s) => s.setEditMode);
  const setAddWidgetOpen = useDashboard((s) => s.setAddWidgetOpen);
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
          <div className="mx-4 glass-card p-12 text-center max-w-lg">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent text-2xl font-semibold">
              +
            </div>
            <h2 className="text-2xl font-semibold mb-2 tracking-tight">Build your deck</h2>
            <p className="text-ink-muted text-sm mb-6 leading-relaxed">
              Turn on Edit mode, add widgets, then drag headers to arrange and resize from the
              corner.
            </p>
            <div className="flex justify-center gap-2">
              {!editMode && (
                <button type="button" className="btn-accent" onClick={() => setEditMode(true)}>
                  Enter Edit mode
                </button>
              )}
              {editMode && (
                <button type="button" className="btn-accent" onClick={() => setAddWidgetOpen(true)}>
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
