import { useEffect, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

const MAX_CITIES = 4;
const DEFAULT_ZONES = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata'];

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
        hour12: false,
      }).format(date),
      label: timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone,
    };
  } catch {
    return { time: '—', label: timeZone };
  }
}

export function WorldClocksWidget({ id, settings }: WidgetProps) {
  const now = useNow();
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const timezones = (settings.timezones as string[]) || DEFAULT_ZONES;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(timezones.join(', '));
  const shown = timezones.slice(0, MAX_CITIES);
  const more = timezones.length - shown.length;

  return (
    <WidgetShell
      id={id}
      title="World Clocks"
      allowScroll={editing}
      onSettings={() => {
        setDraft(timezones.join(', '));
        setEditing((v) => !v);
      }}
    >
      {editing ? (
        <div className="space-y-2" data-no-drag>
          <p className="text-[11px] text-ink-muted">IANA zones (first {MAX_CITIES} shown live)</p>
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
            Save cities
          </button>
        </div>
      ) : (
        <div className="flex gap-2 overflow-hidden items-start">
          {shown.map((tz) => {
            const f = formatInZone(now, tz);
            return (
              <div
                key={tz}
                className="shrink-0 rounded-lg bg-surface-3/50 px-2.5 py-1.5 text-center min-w-[68px]"
              >
                <div className="text-[10px] text-ink-muted truncate max-w-[72px]">{f.label}</div>
                <div className="font-mono text-sm font-semibold tabular-nums">{f.time}</div>
              </div>
            );
          })}
          {more > 0 && (
            <div className="shrink-0 self-center text-[10px] text-ink-muted px-1">+{more} more</div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
