import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import { formatSpeed } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function DiskIoWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const diskIO = metrics?.diskIO;

  const read =
    diskIO?.rBytesPerSec != null
      ? formatSpeed(diskIO.rBytesPerSec)
      : diskIO?.rIO_sec != null
        ? `${diskIO.rIO_sec.toFixed(0)} IOPS`
        : '—';
  const write =
    diskIO?.wBytesPerSec != null
      ? formatSpeed(diskIO.wBytesPerSec)
      : diskIO?.wIO_sec != null
        ? `${diskIO.wIO_sec.toFixed(0)} IOPS`
        : '—';

  return (
    <WidgetShell id={id} title="Disk I/O">
      {!metrics ? (
        <WidgetSkeleton label="Loading disk I/O" />
      ) : !diskIO ? (
        <div className="text-sm text-ink-muted">No disk I/O data</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 h-full content-center">
          <div className="rounded-xl bg-surface-3/50 p-3">
            <div className="text-xs text-emerald-400 mb-1">Read</div>
            <div className="font-mono text-lg font-semibold tabular-nums">{read}</div>
            {diskIO.rBytesPerSec != null && diskIO.rIO_sec != null && (
              <div className="text-[10px] text-ink-muted mt-1 tabular-nums">
                {diskIO.rIO_sec.toFixed(0)} IOPS
              </div>
            )}
          </div>
          <div className="rounded-xl bg-surface-3/50 p-3">
            <div className="text-xs text-sky-400 mb-1">Write</div>
            <div className="font-mono text-lg font-semibold tabular-nums">{write}</div>
            {diskIO.wBytesPerSec != null && diskIO.wIO_sec != null && (
              <div className="text-[10px] text-ink-muted mt-1 tabular-nums">
                {diskIO.wIO_sec.toFixed(0)} IOPS
              </div>
            )}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
