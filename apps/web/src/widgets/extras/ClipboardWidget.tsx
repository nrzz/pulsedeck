import { useEffect, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import type { WidgetProps } from '../registry';

export function ClipboardWidget({ id }: WidgetProps) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const poll = async () => {
      const bridge = window.pulsedeck;
      if (!bridge?.getClipboardHistory) return;
      try {
        const next = await bridge.getClipboardHistory();
        if (Array.isArray(next)) {
          // Keep in React state only — never persist into config (large pastes blew RAM)
          setHistory(next.slice(0, 12).map((s) => String(s).slice(0, 500)));
        }
      } catch {
        // ignore
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 5000);
    return () => clearInterval(timer);
  }, [id]);

  const clear = () => {
    setHistory([]);
  };

  return (
    <WidgetShell
      id={id}
      title="Clipboard"
      actions={
        history.length > 0 ? (
          <button
            type="button"
            className="text-[10px] text-ink-muted hover:text-ink"
            onClick={clear}
          >
            Clear
          </button>
        ) : undefined
      }
    >
      <div className="space-y-2">
        <p className="text-[10px] text-ink-muted">Desktop-only · local history</p>
        {history.length === 0 ? (
          <div className="text-sm text-ink-muted">No clipboard history</div>
        ) : (
          <div className="space-y-1 max-h-full overflow-hidden">
            {history.slice(0, 6).map((item, i) => (
              <div
                key={i}
                className="text-xs font-mono truncate rounded bg-surface-3/50 px-2 py-1"
                title={item}
              >
                {item}
              </div>
            ))}
            {history.length > 6 && (
              <div className="text-[10px] text-ink-muted">+{history.length - 6} more</div>
            )}
          </div>
        )}
      </div>
    </WidgetShell>
  );
}
