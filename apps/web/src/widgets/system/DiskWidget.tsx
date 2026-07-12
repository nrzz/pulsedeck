import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import { formatBytes } from '../../lib/utils';
import type { WidgetProps } from '../registry';
import type { SystemMetrics } from '@pulsedeck/shared';

const EMPTY_DISKS: SystemMetrics['disks'] = [];

export function DiskWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const disks = useDashboard((s) => s.metrics?.disks ?? EMPTY_DISKS);
  const diskThreshold = useDashboard((s) => s.config.shell?.alerts?.disk ?? 90);
  const over = disks.some((d) => d.percent >= diskThreshold);
  // Fit the card — never more rows than the tile can hold without scrolling
  const shown = disks.slice(0, 3);

  return (
    <WidgetShell id={id} title="Disks" alert={over}>
      {!metrics ? (
        <WidgetSkeleton label="Loading disks" />
      ) : (
        <div className="flex flex-col justify-center gap-2 h-full min-h-0 overflow-hidden">
          {shown.length === 0 && <div className="text-sm text-ink-muted">No disks detected</div>}
          {shown.map((d) => (
            <div key={`${d.mount}-${d.fs}`} className="min-w-0">
              <div className="flex justify-between text-[11px] mb-0.5 gap-2 items-baseline">
                <span className="font-medium truncate">{d.mount || d.fs}</span>
                <span className="text-ink-muted font-mono shrink-0 tabular-nums text-[10px]">
                  {d.percent.toFixed(0)}% · {formatBytes(d.available)} free
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, d.percent)}%`,
                    background:
                      d.percent > 90
                        ? '#f87171'
                        : d.percent > 75
                          ? '#fbbf24'
                          : 'rgb(var(--accent))',
                  }}
                />
              </div>
            </div>
          ))}
          {disks.length > shown.length && (
            <div className="text-[10px] text-ink-muted">+{disks.length - shown.length} more</div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
