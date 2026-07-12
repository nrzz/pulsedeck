import { useEffect, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
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
  const timezones = (settings.timezones as string[]) || [
    'UTC',
    'America/New_York',
    'Europe/London',
    'Asia/Kolkata',
  ];

  return (
    <WidgetShell id={id} title="World Clocks">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {timezones.map((tz) => {
          const f = formatInZone(now, tz);
          return (
            <div
              key={tz}
              className="shrink-0 rounded-lg bg-surface-3/50 px-3 py-2 text-center min-w-[72px]"
            >
              <div className="text-[10px] text-ink-muted truncate max-w-[80px]">{f.label}</div>
              <div className="font-mono text-sm font-semibold tabular-nums">{f.time}</div>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}
