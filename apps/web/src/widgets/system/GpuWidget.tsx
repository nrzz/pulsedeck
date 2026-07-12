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

  const gpu = gpus[0];
  const memPct =
    gpu.memoryTotal && gpu.memoryUsed != null
      ? (gpu.memoryUsed / gpu.memoryTotal) * 100
      : undefined;

  return (
    <WidgetShell id={id} title="GPU">
      <div className="flex gap-2.5 h-full items-center min-h-0 overflow-hidden">
        <ProgressRing value={gpu.utilization} label="util" color="#f472b6" size={56} stroke={6} />
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="text-sm font-medium truncate mb-0.5">{gpu.model}</div>
          {memPct != null && (
            <div className="text-[10px] text-ink-muted mb-1 truncate tabular-nums">
              VRAM {formatBytes((gpu.memoryUsed || 0) * 1024 * 1024)} /{' '}
              {formatBytes((gpu.memoryTotal || 0) * 1024 * 1024)} ({memPct.toFixed(0)}%)
            </div>
          )}
          {gpu.temperature != null && (
            <div className="text-[11px] font-mono text-ink-muted">{gpu.temperature}°C</div>
          )}
          {gpus.length > 1 && (
            <div className="text-[10px] text-ink-muted mt-0.5">+{gpus.length - 1} more GPU(s)</div>
          )}
        </div>
      </div>
    </WidgetShell>
  );
}
