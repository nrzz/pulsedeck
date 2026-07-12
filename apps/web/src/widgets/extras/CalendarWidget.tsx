import { useEffect, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { cn } from '../../lib/utils';
import type { WidgetProps } from '../registry';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarWidget({ id }: WidgetProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <WidgetShell id={id} title="Calendar">
      <div className="space-y-2">
        <div className="text-sm font-medium">{monthLabel}</div>
        <div className="grid grid-cols-7 gap-0.5 text-[10px] text-ink-muted text-center">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-xs text-center font-mono tabular-nums">
          {cells.map((day, i) => (
            <div
              key={i}
              className={cn(
                'py-1 rounded',
                day === today && 'bg-accent/30 text-ink font-semibold',
                day == null && 'invisible',
              )}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}
