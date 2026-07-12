import { WidgetShell } from '../../components/WidgetShell';
import { WidgetSkeleton } from '../../components/WidgetSkeleton';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';
import type { SystemMetrics } from '@pulsedeck/shared';

const EMPTY_FANS: NonNullable<SystemMetrics['fans']> = [];

export function FansWidget({ id }: WidgetProps) {
  const metrics = useDashboard((s) => s.metrics);
  const fans = useDashboard((s) => s.metrics?.fans ?? EMPTY_FANS);
  const shown = fans.slice(0, 3);

  return (
    <WidgetShell id={id} title="Fans">
      {!metrics ? (
        <WidgetSkeleton label="Loading fans" />
      ) : fans.length === 0 ? (
        <div className="h-full flex items-center text-sm text-ink-muted">No fan data</div>
      ) : (
        <div className="space-y-1.5 h-full min-h-0 overflow-hidden">
          {shown.map((fan, i) => (
            <div
              key={`${fan.label}-${i}`}
              className="flex justify-between items-center text-[11px] gap-2"
            >
              <span className="text-ink-muted truncate">{fan.label || `Fan ${i + 1}`}</span>
              <span className="font-mono tabular-nums shrink-0">{fan.rpm.toLocaleString()} RPM</span>
            </div>
          ))}
          {fans.length > shown.length && (
            <div className="text-[10px] text-ink-muted">+{fans.length - shown.length} more</div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
