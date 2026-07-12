import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

export function SensorsWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const cpuTemp = metrics?.cpu.temperature;
  const fanRpm = metrics?.fans?.[0]?.rpm;
  const battery = metrics?.battery?.percent;

  return (
    <WidgetShell id={id} title="Sensors">
      {!metrics ? (
        <WidgetSkeleton label="Loading sensors" />
      ) : (
        <div className="flex items-center justify-between gap-2 h-full text-xs font-mono tabular-nums">
          <div className="flex-1 text-center rounded-lg bg-surface-3/50 py-2 px-1">
            <div className="text-[10px] text-ink-muted mb-0.5">CPU</div>
            <div>{cpuTemp != null ? `${cpuTemp.toFixed(0)}°` : '—'}</div>
          </div>
          <div className="flex-1 text-center rounded-lg bg-surface-3/50 py-2 px-1">
            <div className="text-[10px] text-ink-muted mb-0.5">Fan</div>
            <div>{fanRpm != null ? fanRpm.toLocaleString() : '—'}</div>
          </div>
          <div className="flex-1 text-center rounded-lg bg-surface-3/50 py-2 px-1">
            <div className="text-[10px] text-ink-muted mb-0.5">Batt</div>
            <div>{battery != null ? `${battery.toFixed(0)}%` : '—'}</div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
