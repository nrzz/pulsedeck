import { Battery, BatteryCharging } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { ProgressRing } from '../../components/ProgressRing';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

export function BatteryWidget({ id }: WidgetProps) {
  const battery = useDashboard((s) => s.metrics?.battery);

  if (!battery?.hasBattery) {
    return (
      <WidgetShell id={id} title="Battery">
        <div className="h-full flex flex-col items-center justify-center text-sm text-ink-muted gap-2">
          <Battery size={28} className="opacity-40" />
          No battery detected
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell id={id} title="Battery">
      <div className="h-full flex flex-col items-center justify-center gap-2">
        <ProgressRing
          value={battery.percent}
          color={battery.percent < 20 ? '#f87171' : '#34d399'}
          label={battery.isCharging ? 'chg' : 'bat'}
        />
        <div className="flex items-center gap-1 text-xs text-ink-muted">
          {battery.isCharging ? <BatteryCharging size={14} /> : <Battery size={14} />}
          {battery.isCharging ? 'Charging' : 'On battery'}
          {battery.timeRemaining != null && battery.timeRemaining > 0 && (
            <span>· {Math.round(battery.timeRemaining / 60)}h left</span>
          )}
        </div>
      </div>
    </WidgetShell>
  );
}
