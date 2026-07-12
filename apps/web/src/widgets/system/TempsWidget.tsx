import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

export function TempsWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const cpuTemp = metrics?.cpu.temperature;
  const gpuTemp = metrics?.gpu?.[0]?.temperature;

  return (
    <WidgetShell id={id} title="Temperatures">
      {!metrics ? (
        <WidgetSkeleton label="Loading temperatures" />
      ) : (
        <div className="grid grid-cols-2 gap-3 h-full content-center">
          <div className="rounded-xl bg-surface-3/50 p-3 text-center">
            <div className="text-xs text-ink-muted mb-1">CPU</div>
            <div className="font-mono text-xl font-semibold tabular-nums">
              {cpuTemp != null ? `${cpuTemp.toFixed(0)}°C` : '—'}
            </div>
          </div>
          <div className="rounded-xl bg-surface-3/50 p-3 text-center">
            <div className="text-xs text-ink-muted mb-1">GPU</div>
            <div className="font-mono text-xl font-semibold tabular-nums">
              {gpuTemp != null ? `${gpuTemp.toFixed(0)}°C` : '—'}
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
