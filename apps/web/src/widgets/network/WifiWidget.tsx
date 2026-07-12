import { Wifi, WifiOff } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import type { WidgetProps } from '../registry';

export function WifiWidget({ id }: WidgetProps) {
  const wifi = useDashboard((s) => s.metrics?.wifi);

  return (
    <WidgetShell id={id} title="Wi-Fi">
      {!wifi ? (
        <div className="h-full flex flex-col items-center justify-center gap-2 text-ink-muted text-sm">
          <WifiOff size={28} className="opacity-40" />
          Not connected
        </div>
      ) : (
        <div className="h-full flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2">
            <Wifi size={20} className="text-accent" />
            <span className="font-medium truncate">{wifi.ssid}</span>
          </div>
          <div>
            <div className="flex justify-between text-xs text-ink-muted mb-1">
              <span>Signal</span>
              <span className="font-mono">{wifi.quality || wifi.signalLevel}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${Math.min(100, wifi.quality || Math.abs(wifi.signalLevel))}%` }}
              />
            </div>
          </div>
          {wifi.frequency != null && (
            <div className="text-xs text-ink-muted">{wifi.frequency} MHz</div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
