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
        <div className="grid grid-cols-2 gap-2 h-full min-h-0 content-center overflow-hidden">
          <div className="rounded-xl bg-surface-3/50 p-2 text-center min-h-0 overflow-hidden">
            <div className="text-[10px] text-ink-muted mb-0.5">CPU</div>
            <div className="font-mono text-lg font-semibold tabular-nums">
              {cpuTemp != null ? `${cpuTemp.toFixed(0)}°C` : '—'}
            </div>
          </div>
          <div className="rounded-xl bg-surface-3/50 p-2 text-center min-h-0 overflow-hidden">
            <div className="text-[10px] text-ink-muted mb-0.5">GPU</div>
            <div className="font-mono text-lg font-semibold tabular-nums">
              {gpuTemp != null ? `${gpuTemp.toFixed(0)}°C` : '—'}
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
