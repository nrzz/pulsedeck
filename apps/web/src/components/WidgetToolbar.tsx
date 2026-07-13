import { useEffect, useState, type CSSProperties } from 'react';
import {
  LayoutGrid,
  Lock,
  LockOpen,
  Plus,
  Save,
  Settings,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useDashboard } from '../store/dashboard';
import { persistConfig } from '../hooks/useWebSocket';
import { useToast } from '../store/toast';
import { cn } from '../lib/utils';

const dragStyle = { WebkitAppRegion: 'drag' } as CSSProperties;
const noDragStyle = { WebkitAppRegion: 'no-drag' } as CSSProperties;

export function WidgetToolbar() {
  const connected = useDashboard((s) => s.connected);
  const editMode = useDashboard((s) => s.editMode);
  const setEditMode = useDashboard((s) => s.setEditMode);
  const setSettingsOpen = useDashboard((s) => s.setSettingsOpen);
  const setAddWidgetOpen = useDashboard((s) => s.setAddWidgetOpen);
  const shell = useDashboard((s) => s.config.shell);
  const showToast = useToast((s) => s.show);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const api = window.pulsedeck;
    if (!api) return;
    void api.getLocked().then(setLocked);
    const offLock = api.onLockedChanged(setLocked);
    const offEdit = api.onEditLayout(() => setEditMode(true));
    const offSettings = api.onOpenSettings?.(() => setSettingsOpen(true));
    const offAdd = api.onAddWidget?.(() => {
      setEditMode(true);
      setAddWidgetOpen(true);
    });
    return () => {
      offLock();
      offEdit();
      offSettings?.();
      offAdd?.();
    };
  }, [setEditMode, setSettingsOpen, setAddWidgetOpen]);

  const hideForLock = locked && (shell?.hideToolbarWhenLocked ?? true) && !editMode;
  // Always visible so Customize / Settings are discoverable (not hover-only)
  const visible = !hideForLock;

  return (
    <div
      className="widget-chrome"
      data-testid="widget-toolbar"
      data-visible={visible ? 'true' : 'false'}
    >
      <div
        className={cn(
          'widget-drag-strip mx-3 mt-2 inline-flex items-center gap-1 rounded-full border border-white/12 px-1.5 py-1',
          'bg-black/80 shadow-[0_8px_28px_rgba(0,0,0,0.4)]',
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        style={dragStyle}
      >
        <div className="flex items-center gap-0.5" style={noDragStyle}>
          <span
            className={cn(
              'mx-1 w-1.5 h-1.5 rounded-full',
              connected ? 'bg-emerald-400' : 'bg-amber-300',
            )}
            title={connected ? 'Live' : 'Reconnecting'}
          />
          <span className="sr-only">{connected ? 'Live' : 'Reconnecting'}</span>
          {connected ? (
            <Wifi size={11} className="text-emerald-400 mr-0.5" aria-hidden />
          ) : (
            <WifiOff size={11} className="text-amber-300 mr-0.5" aria-hidden />
          )}

          <button
            type="button"
            className={cn(
              'btn !py-1 !px-2 !rounded-full !text-xs inline-flex items-center gap-1',
              editMode && 'bg-accent text-white border-transparent',
            )}
            onClick={() => setEditMode(!editMode)}
            title="Toggle edit mode"
            data-testid="edit-toggle"
          >
            <LayoutGrid size={13} />
            <span className="font-medium">{editMode ? 'Done' : 'Edit'}</span>
          </button>

          {editMode && (
            <button
              type="button"
              className="btn !py-1 !px-2 !rounded-full !text-xs inline-flex items-center gap-1"
              onClick={() => setAddWidgetOpen(true)}
              data-testid="add-widget"
              title="Add widget"
            >
              <Plus size={13} />
              <span className="font-medium">Add</span>
            </button>
          )}

          <button
            type="button"
            className="btn !py-1 !px-2 !rounded-full"
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
            title="Save"
          >
            <Save size={13} />
          </button>

          {window.pulsedeck && (
            <button
              type="button"
              className={cn(
                'btn !py-1 !px-2 !rounded-full',
                locked && 'bg-accent/20 border-accent/40',
              )}
              data-testid="lock-board"
              title={locked ? 'Unlock' : 'Lock (click-through)'}
              onClick={() => void window.pulsedeck?.setLocked(!locked)}
            >
              {locked ? <Lock size={13} /> : <LockOpen size={13} />}
            </button>
          )}

          <button
            type="button"
            className="btn !py-1 !px-2 !rounded-full !text-xs inline-flex items-center gap-1"
            onClick={() => {
              setSettingsOpen(true);
              requestAnimationFrame(() => {
                document.querySelector('[data-testid="layout-packs"]')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                });
              });
            }}
            data-testid="open-presets"
            title="Layout packs"
          >
            <Sparkles size={13} />
            <span className="font-medium">Presets</span>
          </button>

          <button
            type="button"
            className="btn-accent !py-1 !px-2.5 !rounded-full !text-xs inline-flex items-center gap-1"
            onClick={() => setSettingsOpen(true)}
            data-testid="open-settings"
            title="Customize board"
          >
            <Settings size={13} />
            <span className="font-medium">Customize</span>
          </button>
        </div>
      </div>

      {editMode && (
        <div
          className="mx-3 mt-1.5 inline-flex max-w-[90%] rounded-lg border border-accent/30 bg-black/50 px-2.5 py-1.5 text-[10px] text-accent flex-wrap gap-x-3 gap-y-0.5 backdrop-blur-md"
          data-testid="edit-hint"
          style={noDragStyle}
        >
          <span>
            <strong className="font-semibold">Drag</strong> headers
          </span>
          <span>
            <strong className="font-semibold">Resize</strong> corners
          </span>
          <span>
            <strong className="font-semibold">Top edge</strong> moves board
          </span>
        </div>
      )}
    </div>
  );
}
