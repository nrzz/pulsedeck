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
}

export function WidgetShell({
  id,
  title,
  children,
  className,
  actions,
  onSettings,
}: WidgetShellProps) {
  const editMode = useDashboard((s) => s.editMode);
  const removeWidget = useDashboard((s) => s.removeWidget);
  const density = useDashboard((s) => s.config.theme.density);

  return (
    <div
      className={cn(
        'glass-card group/card h-full flex flex-col relative',
        density === 'compact' ? 'p-3' : 'p-4',
        editMode && 'edit-widget ring-1 ring-accent/30 hover:ring-accent/60',
        className,
      )}
    >
      {editMode && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-accent/[0.03]" />
      )}

      <div
        className={cn(
          'widget-drag-region flex items-center gap-2 mb-3 shrink-0 relative z-[1] min-h-[28px]',
          editMode &&
            '-mx-1 px-1 py-1 rounded-xl cursor-grab active:cursor-grabbing select-none hover:bg-white/[0.04]',
        )}
        data-testid="widget-drag-handle"
      >
        {editMode && (
          <span className="text-accent shrink-0" aria-hidden>
            <GripVertical size={18} />
          </span>
        )}
        <h3 className="widget-title flex-1 truncate">{title}</h3>
        <div
          className="flex items-center gap-1 shrink-0"
          data-no-drag
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
          {onSettings && (
            <button
              type="button"
              className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-white/5 transition"
              onClick={onSettings}
              title="Configure widget"
              aria-label="Configure widget"
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
      <div className="flex-1 min-h-0 overflow-auto relative z-[1]">{children}</div>
    </div>
  );
}
