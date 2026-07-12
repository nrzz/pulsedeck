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
  const limit = Math.min(6, Math.max(3, Number(settings.limit ?? 5)));

  const sorted = useMemo(() => {
    return [...processes].sort((a, b) => b.mem - a.mem).slice(0, limit);
  }, [processes, limit]);

  return (
    <WidgetShell id={id} title="Top Memory">
      {!metrics ? (
        <WidgetSkeleton label="Loading processes" />
      ) : (
        <div className="h-full min-h-0 overflow-hidden">
          <table className="w-full text-[11px] table-fixed">
            <thead>
              <tr className="text-ink-muted text-left">
                <th className="pb-1 font-medium">Name</th>
                <th className="pb-1 font-medium text-right w-[34%]">RAM</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={`${p.pid}-${p.name}`} className="border-t border-white/5">
                  <td className="py-0.5 truncate pr-1" title={`${p.name} (${p.pid})`}>
                    {p.name}
                  </td>
                  <td className="py-0.5 text-right font-mono tabular-nums">
                    {p.memRss ? formatBytes(p.memRss * 1024) : `${p.mem.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetShell>
  );
}
