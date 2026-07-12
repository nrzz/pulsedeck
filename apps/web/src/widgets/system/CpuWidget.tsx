import { WidgetShell } from '../../components/WidgetShell';
import { ProgressRing } from '../../components/ProgressRing';
import { Sparkline } from '../../components/Sparkline';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

export function CpuWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const history = useDashboard((s) => s.history.cpu);
  const cpuThreshold = useDashboard((s) => s.config.shell?.alerts?.cpu ?? 90);
  const load = metrics?.cpu.currentLoad ?? 0;
  const cores = metrics?.cpu.cores ?? [];
  const temp = metrics?.cpu.temperature;

  return (
    <WidgetShell id={id} title="CPU" alert={load >= cpuThreshold}>
      {!metrics ? (
        <WidgetSkeleton label="Loading CPU" />
      ) : (
        <div className="flex gap-3 sm:gap-4 h-full min-h-0">
          <div className="flex flex-col items-center justify-center gap-1 shrink-0">
          <ProgressRing value={load} label="load" size={72} stroke={7} />
            {temp != null && (
              <span className="text-xs text-ink-muted font-mono">{temp.toFixed(0)}°C</span>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <Sparkline data={history} color="#2dd4bf" height={36} />
            <div className="mt-2 grid grid-cols-4 gap-1">
              {cores.slice(0, 8).map((c, i) => (
                <div key={i} className="text-center">
                  <div className="h-1 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.min(100, c)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-ink-muted font-mono tabular-nums">{c.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
