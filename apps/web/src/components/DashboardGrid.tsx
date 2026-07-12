import { useCallback, useEffect, useMemo, useState } from 'react';
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { createNamedPresets } from '@pulsedeck/shared';
import { useDashboard } from '../store/dashboard';
import { getWidget } from '../widgets/registry';
import { persistConfig } from '../hooks/useWebSocket';
import { useToast } from '../store/toast';
import { cn } from '../lib/utils';

const AutoGrid = WidthProvider(GridLayout);

function toRglLayout(
  items: Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
  }>,
): Layout[] {
  return items.map((l) => ({
    i: l.i,
    x: l.x,
    y: l.y,
    w: l.w,
    h: l.h,
    minW: l.minW ?? 2,
    minH: l.minH ?? 2,
  }));
}

export function DashboardGrid() {
  const config = useDashboard((s) => s.config);
  const editMode = useDashboard((s) => s.editMode);
  const updateLayout = useDashboard((s) => s.updateLayout);
  const setConfig = useDashboard((s) => s.setConfig);
  const setSettingsOpen = useDashboard((s) => s.setSettingsOpen);
  const showToast = useToast((s) => s.show);
  const [isInteracting, setIsInteracting] = useState(false);

  const preset = useMemo(
    () => config.presets.find((p) => p.id === config.activePresetId) ?? config.presets[0],
    [config],
  );

  const widgetMap = useMemo(() => {
    const map = new Map(preset.widgets.map((w) => [w.id, w]));
    return map;
  }, [preset.widgets]);

  const storeLayout = useMemo(() => toRglLayout(preset.layout), [preset.layout]);

  // Local layout so parent re-renders don't fight RGL mid-drag
  const [localLayout, setLocalLayout] = useState<Layout[]>(storeLayout);

  useEffect(() => {
    if (!isInteracting) {
      setLocalLayout(storeLayout);
    }
  }, [storeLayout, isInteracting]);

  const commitLayout = useCallback(
    async (next: Layout[]) => {
      updateLayout(
        next.map((l) => ({
          i: l.i,
          x: l.x,
          y: l.y,
          w: l.w,
          h: l.h,
          minW: l.minW,
          minH: l.minH,
        })),
      );
      const latest = useDashboard.getState().config;
      setConfig(latest);
      try {
        await persistConfig(latest);
        showToast('Layout updated');
      } catch {
        showToast('Failed to save layout');
      }
    },
    [updateLayout, setConfig, showToast],
  );

  const applyPack = useCallback(
    async (packId: string) => {
      const pack = createNamedPresets().find((p) => p.id === packId);
      if (!pack) return;
      const others = config.presets.filter((p) => p.id !== pack.id);
      const next = { ...config, presets: [...others, pack], activePresetId: pack.id };
      setConfig(next);
      try {
        await persistConfig(next);
        showToast(`Applied ${pack.name}`);
      } catch {
        showToast('Failed to apply pack');
      }
    },
    [config, setConfig, showToast],
  );

  const density = config.theme.density;
  const rowHeight = density === 'compact' ? 56 : density === 'spacious' ? 88 : 72;
  const margin: [number, number] =
    density === 'compact' ? [10, 10] : density === 'spacious' ? [18, 18] : [14, 14];
  const cols = config.shell?.gridCols ?? 12;
  const empty = preset.widgets.length === 0;

  return (
    <div
      className={cn(
        'w-full px-3 sm:px-4 pb-10 transition-all duration-300',
        editMode && 'edit-canvas',
      )}
      style={{ zoom: config.shell?.scale ?? 1 }}
      data-testid="dashboard-grid"
    >
      {empty && (
        <div
          className="mx-auto max-w-md mt-16 mb-8 text-center space-y-4"
          data-testid="empty-board-cta"
        >
          <h2 className="text-lg font-semibold">Your board is empty</h2>
          <p className="text-sm text-ink-muted">Pick a layout pack to get started.</p>
          <div className="flex flex-wrap justify-center gap-2">
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
        </div>
      )}
      <AutoGrid
        className={cn('layout', isInteracting && 'is-interacting')}
        layout={localLayout}
        cols={cols}
        rowHeight={rowHeight}
        margin={margin}
        containerPadding={[0, 0]}
        compactType="vertical"
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle=".widget-drag-region"
        draggableCancel="button,a,input,textarea,[data-no-drag]"
        onLayoutChange={(next) => {
          if (editMode && isInteracting) setLocalLayout(next);
        }}
        onDragStart={() => setIsInteracting(true)}
        onResizeStart={() => setIsInteracting(true)}
        onDragStop={(next) => {
          setLocalLayout(next);
          setIsInteracting(false);
          if (editMode) void commitLayout(next);
        }}
        onResizeStop={(next) => {
          setLocalLayout(next);
          setIsInteracting(false);
          if (editMode) void commitLayout(next);
        }}
        useCSSTransforms
        preventCollision={false}
        allowOverlap={false}
      >
        {preset.layout.map((item, index) => {
          const widget = widgetMap.get(item.i);
          if (!widget) return <div key={item.i} />;
          const def = getWidget(widget.type);
          if (!def) {
            return (
              <div key={item.i}>
                <div className="glass-card h-full p-4 text-sm text-ink-muted">
                  Unknown widget: {widget.type}
                </div>
              </div>
            );
          }
          const Comp = def.component;
          return (
            <div
              key={item.i}
              className="h-full"
              data-widget-id={widget.id}
              data-widget-type={widget.type}
            >
              <div
                className="widget-enter h-full"
                style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
              >
                <Comp id={widget.id} settings={widget.settings} />
              </div>
            </div>
          );
        })}
      </AutoGrid>
    </div>
  );
}
