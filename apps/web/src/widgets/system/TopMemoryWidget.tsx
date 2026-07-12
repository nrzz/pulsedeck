import { useMemo } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import { formatBytes } from '../../lib/utils';
import type { WidgetProps } from '../registry';
import type { SystemMetrics } from '@pulsedeck/shared';

const EMPTY_PROCS: SystemMetrics['processes'] = [];

export function TopMemoryWidget({ id, settings }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const processes = useDashboard((s) => s.metrics?.processes ?? EMPTY_PROCS);
  const limit = Number(settings.limit ?? 8);

  const sorted = useMemo(() => {
    return [...processes].sort((a, b) => b.mem - a.mem).slice(0, limit);
  }, [processes, limit]);

  return (
    <WidgetShell id={id} title="Top Memory">
      {!metrics ? (
        <WidgetSkeleton label="Loading processes" />
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-ink-muted text-left">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium text-right">RAM</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={`${p.pid}-${p.name}`} className="border-t border-white/5">
                <td className="py-1.5 truncate max-w-[160px]" title={`${p.name} (${p.pid})`}>
                  {p.name}
                </td>
                <td className="py-1.5 text-right font-mono tabular-nums">
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
