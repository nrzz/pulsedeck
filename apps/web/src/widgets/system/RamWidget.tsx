import { WidgetShell } from '../../components/WidgetShell';
import { ProgressRing } from '../../components/ProgressRing';
import { Sparkline } from '../../components/Sparkline';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import { formatBytes } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function RamWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const history = useDashboard((s) => s.history.ram);
  const mem = metrics?.memory;
  const ready = !!mem && mem.total > 1024;

  return (
    <WidgetShell id={id} title="Memory">
      {!ready ? (
        <WidgetSkeleton label="Loading memory" />
      ) : (
        <div className="flex gap-3 sm:gap-4 h-full items-center min-h-0">
          <ProgressRing value={mem.percent} label="used" color="#34d399" />
          <div className="flex-1 min-w-0">
            <div className="metric-value text-2xl mb-1">{formatBytes(mem.used)}</div>
            <div className="text-xs text-ink-muted mb-2">
              of {formatBytes(mem.total)} · {formatBytes(mem.free)} free
            </div>
            <Sparkline data={history} color="#34d399" height={40} />
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
