import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { cn } from '../../lib/utils';
import type { WidgetProps } from '../registry';

function aqiLabel(value: number): string {
  if (value <= 50) return 'Good';
  if (value <= 100) return 'Moderate';
  if (value <= 150) return 'Unhealthy (sensitive)';
  if (value <= 200) return 'Unhealthy';
  if (value <= 300) return 'Very unhealthy';
  return 'Hazardous';
}

function aqiColor(value: number): string {
  if (value <= 50) return '#34d399';
  if (value <= 100) return '#fbbf24';
  if (value <= 150) return '#fb923c';
  if (value <= 200) return '#f87171';
  return '#c084fc';
}

export function AqiWidget({ id, settings }: WidgetProps) {
  const aqi = useDashboard((s) => s.aqi);
  const weather = useDashboard((s) => s.weather);
  const city = (settings.city as string) || aqi?.city || weather?.city || '—';
  const value = aqi?.value;

  return (
    <WidgetShell id={id} title="Air Quality">
      {value == null ? (
        <div className="text-sm text-ink-muted">No AQI data</div>
      ) : (
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-mono text-xl font-bold tabular-nums"
            style={{ backgroundColor: `${aqiColor(value)}22`, color: aqiColor(value) }}
          >
            {value}
          </div>
          <div>
            <div className="font-medium">{city}</div>
            <div className={cn('text-sm')} style={{ color: aqiColor(value) }}>
              {aqiLabel(value)}
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
