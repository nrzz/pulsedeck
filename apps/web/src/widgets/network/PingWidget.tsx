import { useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { cn } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function PingWidget({ id, settings }: WidgetProps) {
  const ping = useDashboard((s) => s.ping);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const hosts = (settings.hosts as string[]) || ['1.1.1.1', '8.8.8.8', 'google.com'];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(hosts.join(', '));

  const relevant = ping.filter((p) => hosts.includes(p.host));

  return (
    <WidgetShell
      id={id}
      title="Ping"
      onSettings={() => {
        setDraft(hosts.join(', '));
        setEditing((v) => !v);
      }}
    >
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="input h-20 resize-none font-mono text-xs"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="1.1.1.1, 8.8.8.8, google.com"
          />
          <button
            type="button"
            className="btn-accent w-full justify-center"
            onClick={() => {
              const next = draft
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
              updateWidgetSettings(id, { hosts: next });
              setEditing(false);
            }}
          >
            Save hosts
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {(relevant.length
            ? relevant
            : hosts.map((h) => ({ host: h, alive: false, timeMs: null, timestamp: 0 }))
          ).map((p) => (
            <div key={p.host} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    p.alive ? 'bg-emerald-400' : 'bg-red-400 animate-pulse-soft',
                  )}
                />
                <span className="truncate font-mono text-xs">{p.host}</span>
              </div>
              <span className="font-mono text-xs text-ink-muted">
                {p.alive && p.timeMs != null ? `${p.timeMs.toFixed(0)} ms` : 'timeout'}
              </span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
