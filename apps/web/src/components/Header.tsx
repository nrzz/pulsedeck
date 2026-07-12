import { useState } from 'react';
import { Activity, LayoutGrid, Plus, Save, Settings, Wifi, WifiOff } from 'lucide-react';
import { useDashboard } from '../store/dashboard';
import { persistConfig } from '../hooks/useWebSocket';
import { useToast } from '../store/toast';
import { cn } from '../lib/utils';

export function Header() {
  const connected = useDashboard((s) => s.connected);
  const editMode = useDashboard((s) => s.editMode);
  const setEditMode = useDashboard((s) => s.setEditMode);
  const setSettingsOpen = useDashboard((s) => s.setSettingsOpen);
  const setAddWidgetOpen = useDashboard((s) => s.setAddWidgetOpen);
  const hostname = useDashboard((s) => s.metrics?.system.hostname);
  const hasMetrics = useDashboard((s) => !!s.metrics);
  const showToast = useToast((s) => s.show);
  const [saving, setSaving] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div className="backdrop-blur-2xl bg-surface/65 border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 py-3.5 flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-accent to-cyan-500 flex items-center justify-center shadow-lg shadow-accent/40">
              <Activity size={18} className="text-white" />
              <span className="absolute -inset-1 rounded-2xl bg-accent/20 blur-md -z-10" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold tracking-tight leading-none text-base">PulseDeck</div>
              <div className="text-[11px] text-ink-muted mt-1 truncate">
                {hostname && hostname !== 'unknown' ? hostname : 'Windows dashboard'}
                {connected && !hasMetrics ? ' · warming up…' : ''}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div
            className={cn(
              'hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border',
              connected
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : 'border-amber-500/30 text-amber-300 bg-amber-500/10',
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                connected ? 'bg-emerald-400 animate-pulse-soft' : 'bg-amber-300',
              )}
            />
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Live' : 'Reconnecting…'}
          </div>

          <button
            type="button"
            className={cn(
              'btn',
              editMode && 'bg-accent text-white border-transparent shadow-lg shadow-accent/30',
            )}
            onClick={() => setEditMode(!editMode)}
            title="Toggle edit mode"
            data-testid="edit-toggle"
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">{editMode ? 'Done' : 'Edit'}</span>
          </button>

          {editMode && (
            <button
              type="button"
              className="btn"
              onClick={() => setAddWidgetOpen(true)}
              data-testid="add-widget"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add</span>
            </button>
          )}

          <button
            type="button"
            className="btn"
            disabled={saving}
            data-testid="save-layout"
            onClick={async () => {
              setSaving(true);
              try {
                await persistConfig(useDashboard.getState().config);
                showToast('Layout saved');
              } catch {
                showToast('Save failed');
              } finally {
                setSaving(false);
              }
            }}
            title="Save layout & settings"
          >
            <Save size={14} />
            <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => setSettingsOpen(true)}
            data-testid="open-settings"
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Customize</span>
          </button>
        </div>

        {editMode && (
          <div className="px-4 pb-3 max-w-[1600px] mx-auto animate-fade-up" data-testid="edit-hint">
            <div className="rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/15 via-cyan-500/10 to-transparent px-4 py-2.5 text-[12px] text-accent flex flex-wrap items-center gap-x-5 gap-y-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <strong className="font-semibold text-white/90">Edit mode</strong>
              </span>
              <span>
                <strong className="font-semibold">Drag</strong> any widget header to move
              </span>
              <span>
                <strong className="font-semibold">Resize</strong> from the bottom-right corner
              </span>
              <span>
                <strong className="font-semibold">Done</strong> when finished — layout auto-saves
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
