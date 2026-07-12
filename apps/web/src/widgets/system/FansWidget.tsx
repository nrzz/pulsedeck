import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';
import type { SystemMetrics } from '@pulsedeck/shared';

const EMPTY_FANS: NonNullable<SystemMetrics['fans']> = [];

export function FansWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const fans = useDashboard((s) => s.metrics?.fans ?? EMPTY_FANS);

  return (
    <WidgetShell id={id} title="Fans">
      {!metrics ? (
        <WidgetSkeleton label="Loading fans" />
      ) : fans.length === 0 ? (
        <div className="text-sm text-ink-muted">No fan data</div>
      ) : (
        <div className="space-y-2">
          {fans.map((fan, i) => (
            <div key={`${fan.label}-${i}`} className="flex justify-between items-center text-sm gap-2">
              <span className="text-ink-muted truncate">{fan.label || `Fan ${i + 1}`}</span>
              <span className="font-mono tabular-nums shrink-0">{fan.rpm.toLocaleString()} RPM</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
