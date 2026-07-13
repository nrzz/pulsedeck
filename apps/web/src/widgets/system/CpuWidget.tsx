import { memo } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { ProgressRing } from '../../components/ProgressRing';
import { Sparkline } from '../../components/Sparkline';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

export const CpuWidget = memo(function CpuWidget({ id }: WidgetProps) {
  const load = useDashboard((s) => s.metrics?.cpu.currentLoad ?? 0);
  const cores = useDashboard((s) => s.metrics?.cpu.cores);
  const temp = useDashboard((s) => s.metrics?.cpu.temperature);
  const ready = useDashboard((s) => !!s.metrics);
  const history = useDashboard((s) => s.history.cpu);
  const cpuThreshold = useDashboard((s) => s.config.shell?.alerts?.cpu ?? 90);
  const coreList = cores ?? [];

  return (
    <WidgetShell id={id} title="CPU" alert={load >= cpuThreshold}>
      {!ready ? (
        <WidgetSkeleton label="Loading CPU" />
      ) : (
        <div className="flex gap-2.5 h-full min-h-0 items-center overflow-hidden">
          <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
            <ProgressRing value={load} label="load" size={56} stroke={6} />
            {temp != null && (
              <span className="text-[10px] text-ink-muted font-mono">{temp.toFixed(0)}°C</span>
            )}
          </div>
          <div className="flex-1 min-w-0 min-h-0 flex flex-col justify-center overflow-hidden">
            <Sparkline data={history} color="#2dd4bf" height={28} />
            <div className="mt-1.5 grid grid-cols-4 gap-0.5">
              {coreList.slice(0, 8).map((c, i) => (
                <div key={i} className="text-center min-w-0">
                  <div className="h-1 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.min(100, c)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-ink-muted font-mono tabular-nums leading-none">
                    {c.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
});
