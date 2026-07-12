import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import { cn } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function AlertsWidget({ id, settings }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const cpuThreshold = Number(settings.cpuThreshold ?? 90);
  const ramThreshold = Number(settings.ramThreshold ?? 90);
  const diskThreshold = Number(settings.diskThreshold ?? 90);

  const cpuLoad = metrics?.cpu.currentLoad ?? 0;
  const ramPercent = metrics?.memory.percent ?? 0;
  const maxDiskPercent = Math.max(0, ...(metrics?.disks.map((d) => d.percent) ?? [0]));

  const alerts = [
    { label: 'CPU', value: cpuLoad, threshold: cpuThreshold, unit: '%' },
    { label: 'RAM', value: ramPercent, threshold: ramThreshold, unit: '%' },
    { label: 'Disk', value: maxDiskPercent, threshold: diskThreshold, unit: '%' },
  ].filter((a) => a.value > a.threshold);

  return (
    <WidgetShell id={id} title="Alerts">
      {!metrics ? (
        <WidgetSkeleton label="Loading alerts" />
      ) : alerts.length === 0 ? (
        <div className="text-sm text-emerald-400">All clear</div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.label}
              className={cn(
                'flex justify-between items-center text-sm rounded-lg px-2 py-1.5',
                'bg-red-400/10 text-red-300',
              )}
            >
              <span className="font-medium">{a.label}</span>
              <span className="font-mono tabular-nums">
                {a.value.toFixed(0)}
                {a.unit} &gt; {a.threshold}
                {a.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
