import { useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

export function ClipboardWidget({ id, settings }: WidgetProps) {
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const stored = (settings.history as string[]) || [];
  const [local, setLocal] = useState<string[]>([]);
  const history = stored.length ? stored : local;

  const clear = () => {
    setLocal([]);
    updateWidgetSettings(id, { history: [] });
  };

  return (
    <WidgetShell
      id={id}
      title="Clipboard"
      actions={
        history.length > 0 ? (
          <button type="button" className="text-[10px] text-ink-muted hover:text-ink" onClick={clear}>
            Clear
          </button>
        ) : undefined
      }
    >
      <div className="space-y-2">
        <p className="text-[10px] text-ink-muted">Desktop-only · syncs when available</p>
        {history.length === 0 ? (
          <div className="text-sm text-ink-muted">No clipboard history</div>
        ) : (
          <div className="space-y-1 max-h-full overflow-hidden">
            {history.map((item, i) => (
              <div
                key={i}
                className="text-xs font-mono truncate rounded bg-surface-3/50 px-2 py-1"
                title={item}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetShell>
  );
}
