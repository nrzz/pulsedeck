import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

function formatUptimeDetailed(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

export function UptimeWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const uptime = metrics?.system.uptime;

  return (
    <WidgetShell id={id} title="Uptime">
      {!metrics ? (
        <WidgetSkeleton label="Loading uptime" />
      ) : (
        <div className="flex flex-col justify-center h-full">
          <div className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {uptime != null ? formatUptimeDetailed(uptime) : '—'}
          </div>
          <div className="text-xs text-ink-muted mt-1">{metrics.system.hostname}</div>
        </div>
      )}
    </WidgetShell>
  );
}
