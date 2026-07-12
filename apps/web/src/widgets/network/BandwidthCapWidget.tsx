import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { formatBytes } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function BandwidthCapWidget({ id, settings }: WidgetProps) {
  const net = useDashboard((s) => s.metrics?.network?.[0]);
  const capGb = Number(settings.capGb ?? 100);
  const capBytes = capGb * 1024 * 1024 * 1024;
  const used = (net?.rxBytes ?? 0) + (net?.txBytes ?? 0);
  const percent = capBytes > 0 ? Math.min(100, (used / capBytes) * 100) : 0;

  return (
    <WidgetShell id={id} title="Bandwidth Cap">
      <div className="space-y-2 h-full flex flex-col justify-center">
        <div className="flex justify-between text-xs">
          <span className="text-ink-muted">Session usage</span>
          <span className="font-mono tabular-nums">
            {formatBytes(used)} / {capGb} GB
          </span>
        </div>
        <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              background: percent > 90 ? '#f87171' : percent > 75 ? '#fbbf24' : 'rgb(var(--accent))',
            }}
          />
        </div>
        <div className="text-[10px] text-ink-muted font-mono tabular-nums text-right">
          {percent.toFixed(1)}%
        </div>
      </div>
    </WidgetShell>
  );
}
