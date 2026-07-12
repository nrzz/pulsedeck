import { useEffect, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

const MAX_ZONES = 4;

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

  const shown = timezones.slice(0, MAX_ZONES);
  const more = timezones.length - shown.length;

  return (
    <WidgetShell
      id={id}
      title="Clocks"
      allowScroll={editing}
      onSettings={() => {
        setDraft(timezones.join(', '));
        setEditing((v) => !v);
      }}
    >
      {editing ? (
        <div className="space-y-2" data-no-drag>
          <p className="text-[11px] text-ink-muted">
            IANA timezones (first {MAX_ZONES} shown live)
          </p>
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
        <div className="space-y-2 overflow-hidden h-full min-h-0">
          <div>
            <div className="text-[10px] text-ink-muted">Local</div>
            <div className="font-mono text-xl font-semibold tracking-tight leading-tight">
              {local}
            </div>
            <div className="text-[10px] text-ink-muted">
              {now.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
          <div className="space-y-1 border-t border-white/5 pt-1.5">
            {shown.map((tz) => {
              const f = formatInZone(now, tz);
              return (
                <div key={tz} className="flex justify-between text-xs gap-2">
                  <span className="text-ink-muted truncate">{f.label}</span>
                  <span className="font-mono shrink-0">{f.time}</span>
                </div>
              );
            })}
            {more > 0 && <div className="text-[10px] text-ink-muted">+{more} more</div>}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
