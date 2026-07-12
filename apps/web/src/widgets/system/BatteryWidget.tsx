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
        <div className="h-full flex flex-col items-center justify-center text-sm text-ink-muted gap-1.5 overflow-hidden">
          <Battery size={22} className="opacity-40" />
          No battery detected
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell id={id} title="Battery">
      <div className="h-full flex flex-col items-center justify-center gap-1.5 min-h-0 overflow-hidden">
        <ProgressRing
          value={battery.percent}
          size={52}
          stroke={5}
          color={battery.percent < 20 ? '#f87171' : '#34d399'}
          label={battery.isCharging ? 'chg' : 'bat'}
        />
        <div className="flex items-center gap-1 text-[10px] text-ink-muted truncate max-w-full px-1">
          {battery.isCharging ? <BatteryCharging size={12} /> : <Battery size={12} />}
          {battery.isCharging ? 'Charging' : 'On battery'}
          {battery.timeRemaining != null && battery.timeRemaining > 0 && (
            <span>· {Math.round(battery.timeRemaining / 60)}h</span>
          )}
        </div>
      </div>
    </WidgetShell>
  );
}
