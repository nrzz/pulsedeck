import { memo } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { ProgressRing } from '../../components/ProgressRing';
import { Sparkline } from '../../components/Sparkline';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import { formatBytes } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export const RamWidget = memo(function RamWidget({ id }: WidgetProps) {
  const mem = useDashboard((s) => s.metrics?.memory);
  const history = useDashboard((s) => s.history.ram);
  const ramThreshold = useDashboard((s) => s.config.shell?.alerts?.ram ?? 90);
  const ready = !!mem && mem.total > 1024;

  return (
    <WidgetShell id={id} title="Memory" alert={ready && mem.percent >= ramThreshold}>
      {!ready ? (
        <WidgetSkeleton label="Loading memory" />
      ) : (
        <div className="flex gap-2.5 h-full items-center min-h-0 overflow-hidden">
          <ProgressRing value={mem.percent} label="used" color="#34d399" size={56} stroke={6} />
          <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
            <div className="metric-value text-lg mb-0.5">{formatBytes(mem.used)}</div>
            <div className="text-[10px] text-ink-muted mb-1.5 tabular-nums truncate">
              of {formatBytes(mem.total)} · {formatBytes(mem.free)} free
            </div>
            <Sparkline data={history} color="#34d399" height={24} />
          </div>
        </div>
      )}
    </WidgetShell>
  );
});
