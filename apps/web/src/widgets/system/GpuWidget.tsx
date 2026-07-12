import { WidgetShell } from '../../components/WidgetShell';
import { ProgressRing } from '../../components/ProgressRing';
import { useDashboard } from '../../store/dashboard';
import { formatBytes } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function GpuWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const gpus = metrics?.gpu ?? [];

  if (!gpus.length) {
    return (
      <WidgetShell id={id} title="GPU">
        <div className="h-full flex items-center justify-center text-sm text-ink-muted">
          No GPU data available
        </div>
      </WidgetShell>
    );
  }

  const primary = gpus[0];
  const memPct =
    primary.memoryTotal && primary.memoryUsed != null
      ? (primary.memoryUsed / primary.memoryTotal) * 100
      : undefined;

  return (
    <WidgetShell id={id} title="GPU" allowScroll={gpus.length > 1}>
      <div className="flex gap-2.5 h-full items-start min-h-0">
        <ProgressRing
          value={primary.utilization}
          label="util"
          color="#f472b6"
          size={56}
          stroke={6}
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div>
            <div className="text-sm font-medium truncate mb-0.5">{primary.model}</div>
            {memPct != null && (
              <div className="text-[10px] text-ink-muted truncate tabular-nums">
                VRAM {formatBytes((primary.memoryUsed || 0) * 1024 * 1024)} /{' '}
                {formatBytes((primary.memoryTotal || 0) * 1024 * 1024)} ({memPct.toFixed(0)}%)
              </div>
            )}
            {primary.temperature != null && (
              <div className="text-[11px] font-mono text-ink-muted">{primary.temperature}°C</div>
            )}
          </div>
          {gpus.length > 1 && (
            <div className="space-y-1 border-t border-white/5 pt-1">
              {gpus.slice(1).map((g) => {
                const m =
                  g.memoryTotal && g.memoryUsed != null
                    ? (g.memoryUsed / g.memoryTotal) * 100
                    : undefined;
                return (
                  <div key={g.model} className="flex justify-between gap-2 text-[11px]">
                    <span className="truncate min-w-0 text-ink-muted">{g.model}</span>
                    <span className="shrink-0 font-mono tabular-nums">
                      {g.utilization.toFixed(0)}%
                      {g.temperature != null ? ` · ${g.temperature}°C` : ''}
                      {m != null ? ` · ${m.toFixed(0)}% mem` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </WidgetShell>
  );
}
