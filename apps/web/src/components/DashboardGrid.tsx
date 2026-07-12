import { useCallback, useEffect, useMemo, useState } from 'react';
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
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

  const storeLayout = useMemo(() => {
    // Enforce registry min sizes so old saved layouts don't clip dense widgets.
    const clamped = preset.layout.map((item) => {
      const widget = preset.widgets.find((w) => w.id === item.i);
      const def = widget ? getWidget(widget.type) : undefined;
      const minW = Math.max(item.minW ?? 2, def?.defaultSize.minW ?? 2);
      const minH = Math.max(item.minH ?? 2, def?.defaultSize.minH ?? 2);
      const w = Math.max(item.w, minW);
      const h = Math.max(item.h, minH);
      const x = Math.min(Math.max(0, item.x), Math.max(0, (config.shell?.gridCols ?? 12) - w));
      return { ...item, w, h, x, minW, minH };
    });
    return toRglLayout(clamped);
  }, [preset.layout, preset.widgets, config.shell?.gridCols]);

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

  const density = config.theme.density;
  const scale = Number(config.shell?.scale ?? 1) || 1;
  const baseRow = density === 'compact' ? 56 : density === 'spacious' ? 88 : 72;
  const rowHeight = Math.round(baseRow * scale);
  const baseMargin = density === 'compact' ? 10 : density === 'spacious' ? 18 : 14;
  const margin: [number, number] = [Math.round(baseMargin * scale), Math.round(baseMargin * scale)];
  const cols = config.shell?.gridCols ?? 12;
  const snap = config.shell?.snapToGrid !== false;

  return (
    <div
      className={cn(
        'w-full px-3 sm:px-4 pb-10 transition-all duration-300',
        editMode && 'edit-canvas',
      )}
      style={{ ['--grid-guide-step' as string]: `${rowHeight + margin[1]}px` }}
      data-testid="dashboard-grid"
    >
      <AutoGrid
        className={cn('layout', isInteracting && 'is-interacting')}
        layout={localLayout}
        cols={cols}
        rowHeight={rowHeight}
        margin={margin}
        containerPadding={[0, 0]}
        compactType={snap ? 'vertical' : null}
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
