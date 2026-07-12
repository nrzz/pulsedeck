import { useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { formatBytes } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function BandwidthCapWidget({ id, settings }: WidgetProps) {
  const net = useDashboard((s) => s.metrics?.network?.[0]);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const capGb = Number(settings.capGb ?? 100);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(capGb));
  const capBytes = capGb * 1024 * 1024 * 1024;
  const used = (net?.rxBytes ?? 0) + (net?.txBytes ?? 0);
  const percent = capBytes > 0 ? Math.min(100, (used / capBytes) * 100) : 0;

  return (
    <WidgetShell
      id={id}
      title="Bandwidth Cap"
      allowScroll={editing}
      onSettings={() => {
        setDraft(String(capGb));
        setEditing((v) => !v);
      }}
    >
      {editing ? (
        <div className="space-y-2" data-no-drag>
          <p className="text-[11px] text-ink-muted">Monthly / session cap (GB)</p>
          <input
            className="input font-mono"
            type="number"
            min={1}
            step={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            className="btn-accent w-full justify-center"
            onClick={() => {
              const n = Number(draft);
              if (!Number.isFinite(n) || n <= 0) return;
              updateWidgetSettings(id, { capGb: n });
              setEditing(false);
            }}
          >
            Save cap
          </button>
        </div>
      ) : (
        <div className="space-y-2 h-full flex flex-col justify-center">
          <div className="flex justify-between text-xs gap-2">
            <span className="text-ink-muted shrink-0">Session usage</span>
            <span className="font-mono tabular-nums truncate">
              {formatBytes(used)} / {capGb} GB
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percent}%`,
                background: percent > 90 ? '#f87171' : percent > 75 ? '#fbbf24' : 'rgb(var(--accent))',
              }}
            />
          </div>
          <div className="text-[10px] text-ink-muted font-mono tabular-nums text-right">
            {percent.toFixed(1)}%
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
