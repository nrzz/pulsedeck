import { useEffect, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

function useNow(tickMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  return now;
}

function formatInZone(date: Date, timeZone: string) {
  try {
    return {
      time: new Intl.DateTimeFormat(undefined, {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date),
      label: timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone,
    };
  } catch {
    return { time: '—', label: timeZone };
  }
}

export function ClockWidget({ id, settings }: WidgetProps) {
  const now = useNow();
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const timezones = (settings.timezones as string[]) || ['UTC', 'America/New_York', 'Asia/Kolkata'];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(timezones.join(', '));

  const local = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <WidgetShell
      id={id}
      title="Clocks"
      onSettings={() => {
        setDraft(timezones.join(', '));
        setEditing((v) => !v);
      }}
    >
      {editing ? (
        <div className="space-y-2">
          <p className="text-[11px] text-ink-muted">IANA timezones</p>
          <textarea
            className="input h-20 resize-none font-mono text-xs"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            className="btn-accent w-full justify-center"
            onClick={() => {
              const next = draft
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
              updateWidgetSettings(id, { timezones: next });
              setEditing(false);
            }}
          >
            Save
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="text-xs text-ink-muted">Local</div>
            <div className="font-mono text-2xl font-semibold tracking-tight">{local}</div>
            <div className="text-xs text-ink-muted">
              {now.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
          <div className="space-y-1.5 border-t border-white/5 pt-2">
            {timezones.map((tz) => {
              const f = formatInZone(now, tz);
              return (
                <div key={tz} className="flex justify-between text-xs">
                  <span className="text-ink-muted truncate">{f.label}</span>
                  <span className="font-mono">{f.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
