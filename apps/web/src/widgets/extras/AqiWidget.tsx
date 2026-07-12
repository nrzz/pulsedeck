import { useState } from 'react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { cn } from '../../lib/utils';
import type { WidgetProps } from '../registry';

const CITY_PRESETS = [
  { city: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { city: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { city: 'New Delhi', lat: 28.6139, lon: 77.209 },
  { city: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { city: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { city: 'Pune', lat: 18.5204, lon: 73.8567 },
] as const;

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
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const [editing, setEditing] = useState(false);
  const city = (settings.city as string) || aqi?.city || weather?.city || 'Bangalore';
  const [draftCity, setDraftCity] = useState(city);
  const [lat, setLat] = useState(String(settings.lat ?? 12.9716));
  const [lon, setLon] = useState(String(settings.lon ?? 77.5946));
  const value = aqi?.value;

  const apply = (nextCity: string, nextLat: number, nextLon: number) => {
    updateWidgetSettings(id, { city: nextCity, lat: nextLat, lon: nextLon });
    setEditing(false);
    void fetch(
      `/api/aqi?lat=${nextLat}&lon=${nextLon}&city=${encodeURIComponent(nextCity)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.value != null) useDashboard.getState().setAqi(data);
      })
      .catch(() => undefined);
  };

  return (
    <WidgetShell
      id={id}
      title="Air Quality"
      allowScroll={editing}
      onSettings={() => {
        setDraftCity(city);
        setLat(String(settings.lat ?? 12.9716));
        setLon(String(settings.lon ?? 77.5946));
        setEditing((v) => !v);
      }}
    >
      {editing ? (
        <div className="space-y-2" data-no-drag>
          <div className="flex flex-wrap gap-1">
            {CITY_PRESETS.map((p) => (
              <button
                key={p.city}
                type="button"
                className="btn !py-0.5 !px-2 !text-[11px] !rounded-full"
                onClick={() => apply(p.city, p.lat, p.lon)}
              >
                {p.city}
              </button>
            ))}
          </div>
          <input
            className="input"
            value={draftCity}
            onChange={(e) => setDraftCity(e.target.value)}
            placeholder="City"
          />
          <div className="grid grid-cols-2 gap-2">
            <input className="input" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Lat" />
            <input className="input" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="Lon" />
          </div>
          <button
            type="button"
            className="btn-accent w-full justify-center"
            onClick={() => apply(draftCity.trim() || city, Number(lat), Number(lon))}
          >
            Save location
          </button>
        </div>
      ) : value == null ? (
        <div className="text-sm text-ink-muted">No AQI data yet</div>
      ) : (
        <div className="flex items-center gap-4 overflow-hidden">
          <div
            className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center font-mono text-lg font-bold tabular-nums"
            style={{ backgroundColor: `${aqiColor(value)}22`, color: aqiColor(value) }}
          >
            {value}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{city}</div>
            <div className={cn('text-sm truncate')} style={{ color: aqiColor(value) }}>
              {aqiLabel(value)}
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
