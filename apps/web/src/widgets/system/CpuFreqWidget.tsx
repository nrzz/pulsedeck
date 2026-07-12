import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

function toGhz(value?: number): string {
  if (value == null) return '—';
  const ghz = value >= 100 ? value / 1000 : value;
  return `${ghz.toFixed(2)} GHz`;
}

export function CpuFreqWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const cpu = metrics?.cpu;

  return (
    <WidgetShell id={id} title="CPU Frequency">
      {!metrics ? (
        <WidgetSkeleton label="Loading CPU frequency" />
      ) : (
        <div className="space-y-2 overflow-hidden h-full min-h-0">
          <div>
            <div className="text-[10px] text-ink-muted mb-0.5">Current</div>
            <div className="font-mono text-xl font-semibold tabular-nums leading-tight">
              {toGhz(cpu?.speed)}
            </div>
          </div>
          {(cpu?.speedMin != null || cpu?.speedMax != null) && (
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="rounded-lg bg-surface-3/50 px-2 py-1.5">
                <div className="text-ink-muted text-[10px]">Min</div>
                <div className="font-mono tabular-nums">{toGhz(cpu?.speedMin)}</div>
              </div>
              <div className="rounded-lg bg-surface-3/50 px-2 py-1.5">
                <div className="text-ink-muted text-[10px]">Max</div>
                <div className="font-mono tabular-nums">{toGhz(cpu?.speedMax)}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
