import { useState } from 'react';
import { Cloud } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { weatherLabel } from '../../lib/utils';
import type { WidgetProps } from '../registry';

export function WeatherWidget({ id, settings }: WidgetProps) {
  const weather = useDashboard((s) => s.weather);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const [editing, setEditing] = useState(false);
  const [city, setCity] = useState(String(settings.city ?? 'New Delhi'));
  const [lat, setLat] = useState(String(settings.lat ?? 28.6139));
  const [lon, setLon] = useState(String(settings.lon ?? 77.209));

  let body;
  if (editing) {
    body = (
      <div className="space-y-2">
        <input
          className="input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City label"
        />
        <input
          className="input"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude"
        />
        <input
          className="input"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          placeholder="Longitude"
        />
        <button
          type="button"
          className="btn-accent w-full justify-center"
          onClick={() => {
            updateWidgetSettings(id, {
              city,
              lat: Number(lat),
              lon: Number(lon),
            });
            setEditing(false);
          }}
        >
          Save location
        </button>
      </div>
    );
  } else if (!weather) {
    body = (
      <div className="h-full flex flex-col items-center justify-center text-center gap-1">
        <Cloud className="text-accent mb-1 opacity-60" size={28} />
        <div className="text-sm text-ink-muted">Fetching weather…</div>
        <div className="text-xs text-ink-muted">{String(settings.city ?? '')}</div>
      </div>
    );
  } else {
    body = (
      <div className="h-full flex flex-col items-center justify-center text-center gap-1">
        <Cloud className="text-accent mb-1" size={28} />
        <div className="text-3xl font-mono font-semibold">
          {`${Math.round(weather.temperature)}°`}
        </div>
        <div className="text-sm">{weatherLabel(weather.weatherCode)}</div>
        <div className="text-xs text-ink-muted">{weather.city || String(settings.city ?? '')}</div>
        <div className="text-[11px] text-ink-muted mt-1">
          Wind {weather.windSpeed.toFixed(0)} km/h
          {weather.humidity != null ? ` · ${weather.humidity}% humidity` : ''}
        </div>
      </div>
    );
  }

  return (
    <WidgetShell id={id} title="Weather" onSettings={() => setEditing((v) => !v)}>
      {body}
    </WidgetShell>
  );
}
