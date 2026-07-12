import { useMemo, useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import { formatBytes, cn } from '../../lib/utils';
import type { WidgetProps } from '../registry';
import type { SystemMetrics } from '@pulsedeck/shared';

const EMPTY_PROCS: SystemMetrics['processes'] = [];

export function ProcessesWidget({ id, settings }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const processes = useDashboard((s) => s.metrics?.processes ?? EMPTY_PROCS);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const [sortBy, setSortBy] = useState<'cpu' | 'mem'>((settings.sortBy as 'cpu' | 'mem') || 'cpu');
  const limit = Number(settings.limit ?? 8);

  const sorted = useMemo(() => {
    const list = [...processes];
    list.sort((a, b) => (sortBy === 'cpu' ? b.cpu - a.cpu : b.mem - a.mem));
    return list.slice(0, limit);
  }, [processes, sortBy, limit]);

  const toggle = (key: 'cpu' | 'mem') => {
    setSortBy(key);
    updateWidgetSettings(id, { sortBy: key });
  };

  return (
    <WidgetShell
      id={id}
      title="Processes"
      actions={
        <div className="flex gap-1 text-[10px]">
          <button
            type="button"
            className={cn(
              'px-2 py-0.5 rounded-lg',
              sortBy === 'cpu' ? 'bg-accent/30 text-ink' : 'text-ink-muted',
            )}
            onClick={() => toggle('cpu')}
          >
            CPU
          </button>
          <button
            type="button"
            className={cn(
              'px-2 py-0.5 rounded-lg',
              sortBy === 'mem' ? 'bg-accent/30 text-ink' : 'text-ink-muted',
            )}
            onClick={() => toggle('mem')}
          >
            RAM
          </button>
        </div>
      }
    >
      {!metrics ? (
        <WidgetSkeleton label="Loading processes" />
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-ink-muted text-left">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium text-right">CPU</th>
              <th className="pb-2 font-medium text-right">RAM</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={`${p.pid}-${p.name}`} className="border-t border-white/5">
                <td className="py-1.5 truncate max-w-[140px]" title={`${p.name} (${p.pid})`}>
                  {p.name}
                </td>
                <td className="py-1.5 text-right font-mono">{p.cpu.toFixed(1)}%</td>
                <td className="py-1.5 text-right font-mono">
                  {p.memRss ? formatBytes(p.memRss * 1024) : `${p.mem.toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </WidgetShell>
  );
}
