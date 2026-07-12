import type { ReactNode } from 'react';
import { X, GripVertical, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDashboard } from '../store/dashboard';

interface WidgetShellProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  onSettings?: () => void;
  /** Tint card when a threshold is exceeded */
  alert?: boolean;
  /** Only for gear/config panels — live metrics never scroll */
  allowScroll?: boolean;
}

export function WidgetShell({
  id,
  title,
  children,
  className,
  actions,
  onSettings,
  alert,
  allowScroll,
}: WidgetShellProps) {
  const editMode = useDashboard((s) => s.editMode);
  const removeWidget = useDashboard((s) => s.removeWidget);
  const density = useDashboard((s) => s.config.theme.density);
  const showTitles = useDashboard((s) => s.config.theme.showWidgetTitles !== false);
  const hideChrome = !showTitles && !editMode;
  const hasChromeActions = Boolean(actions || onSettings || editMode);

  return (
    <div
      className={cn(
        'glass-card group/card h-full flex flex-col relative overflow-hidden',
        density === 'compact' ? 'p-2.5' : density === 'spacious' ? 'p-4' : 'p-3',
        editMode && 'edit-widget ring-1 ring-accent/30 hover:ring-accent/60',
        alert && 'ring-1 ring-amber-400/50 bg-amber-500/[0.06]',
        className,
      )}
      data-alert={alert ? 'true' : undefined}
    >
      {alert && (
        <span
          className="absolute top-2 right-2 z-[2] w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
          title="Threshold exceeded"
          data-testid="alert-dot"
        />
      )}
          {editMode && (
        <div className="pointer-events-none absolute inset-0 rounded-[var(--card-radius)] bg-accent/[0.03]" />
      )}

      {hideChrome ? (
        hasChromeActions && (
          <div
            className="absolute top-1 right-1 z-[2] flex items-center gap-0.5"
            data-no-drag
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
            {onSettings && (
              <button
                type="button"
                className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-white/5 transition opacity-60 group-hover/card:opacity-100"
                onClick={onSettings}
                title="Configure widget"
                aria-label="Configure widget"
                data-testid="widget-gear"
              >
                <Settings2 size={14} />
              </button>
            )}
          </div>
        )
      ) : (
        <div
          className={cn(
            'widget-drag-region flex items-center gap-2 mb-1.5 shrink-0 relative z-[1] min-h-[22px]',
            editMode &&
              '-mx-1 px-1 py-0.5 rounded-xl cursor-grab active:cursor-grabbing select-none hover:bg-white/[0.04]',
          )}
          data-testid="widget-drag-handle"
        >
          {editMode && (
            <span className="text-accent shrink-0" aria-hidden>
              <GripVertical size={16} />
            </span>
          )}
          <h3 className="widget-title flex-1 truncate" title={title}>
            {title}
          </h3>
          <div
            className="flex items-center gap-0.5 shrink-0"
            data-no-drag
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
            {onSettings && (
              <button
                type="button"
                className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-white/5 transition opacity-70 group-hover/card:opacity-100"
                onClick={onSettings}
                title="Configure widget"
                aria-label="Configure widget"
                data-testid="widget-gear"
              >
                <Settings2 size={14} />
              </button>
            )}
            {editMode && (
              <button
                type="button"
                className="p-1 rounded-lg text-ink-muted hover:text-red-400 hover:bg-red-500/10 transition"
                onClick={() => removeWidget(id)}
                title="Remove widget"
                aria-label="Remove widget"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Most live widgets clip. allowScroll for gear panels + News tray. */}
      <div
        className={cn(
          'widget-body flex-1 min-h-0 relative z-[1]',
          allowScroll ? 'widget-body-scroll overflow-y-auto' : 'overflow-hidden',
        )}
      >
        {children}
      </div>
    </div>
  );
}
