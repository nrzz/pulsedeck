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
      <div className="flex gap-4 h-full items-center">
        <ProgressRing value={gpu.utilization} label="util" color="#f472b6" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate mb-1">{gpu.model}</div>
          {memPct != null && (
            <div className="text-xs text-ink-muted mb-2">
              VRAM {formatBytes((gpu.memoryUsed || 0) * 1024 * 1024)} /{' '}
              {formatBytes((gpu.memoryTotal || 0) * 1024 * 1024)} ({memPct.toFixed(0)}%)
            </div>
          )}
          {gpu.temperature != null && (
            <div className="text-xs font-mono text-ink-muted">{gpu.temperature}°C</div>
          )}
          {gpus.length > 1 && (
            <div className="text-[10px] text-ink-muted mt-1">+{gpus.length - 1} more GPU(s)</div>
          )}
        </div>
      </div>
    </WidgetShell>
  );
}
