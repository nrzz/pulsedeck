import { WidgetShell } from '../../components/WidgetShell';
import { ProgressRing } from '../../components/ProgressRing';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import { formatBytes } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function SwapWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const mem = metrics?.memory;
  const hasSwap = mem && (mem.swapTotal ?? 0) > 0;

  return (
    <WidgetShell id={id} title="Swap">
      {!metrics ? (
        <WidgetSkeleton label="Loading swap" />
      ) : !hasSwap ? (
        <div className="text-sm text-ink-muted">No swap configured</div>
      ) : (
        <div className="flex gap-3 items-center h-full">
          <ProgressRing
            value={mem.swapPercent ?? 0}
            label="used"
            size={72}
            stroke={7}
            color="#a78bfa"
          />
          <div className="flex-1 min-w-0 text-xs space-y-1">
            <div className="font-mono tabular-nums">{formatBytes(mem.swapUsed ?? 0)} used</div>
            <div className="text-ink-muted tabular-nums">of {formatBytes(mem.swapTotal ?? 0)}</div>
            <div className="text-ink-muted tabular-nums">{formatBytes(mem.swapFree ?? 0)} free</div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
