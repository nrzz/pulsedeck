import { useState } from 'react';
import { Cloud, MapPin } from 'lucide-react';
import { WidgetShell } from '../../components/WidgetShell';
import { useDashboard } from '../../store/dashboard';
import { weatherLabel } from '../../lib/utils';
import type { WidgetProps } from '../registry';

const CITY_PRESETS = [
  { city: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { city: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { city: 'New Delhi', lat: 28.6139, lon: 77.209 },
  { city: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { city: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { city: 'Pune', lat: 18.5204, lon: 73.8567 },
] as const;

const DEFAULT_CITY = CITY_PRESETS[0];

export function WeatherWidget({ id, settings }: WidgetProps) {
  const weather = useDashboard((s) => s.weather);
  const updateWidgetSettings = useDashboard((s) => s.updateWidgetSettings);
  const [editing, setEditing] = useState(false);
  const [city, setCity] = useState(String(settings.city ?? DEFAULT_CITY.city));
  const [lat, setLat] = useState(String(settings.lat ?? DEFAULT_CITY.lat));
  const [lon, setLon] = useState(String(settings.lon ?? DEFAULT_CITY.lon));

  const applyPreset = (preset: (typeof CITY_PRESETS)[number]) => {
    setCity(preset.city);
    setLat(String(preset.lat));
    setLon(String(preset.lon));
    updateWidgetSettings(id, {
      city: preset.city,
      lat: preset.lat,
      lon: preset.lon,
    });
    setEditing(false);
    void fetch(
      `/api/weather?lat=${preset.lat}&lon=${preset.lon}&city=${encodeURIComponent(preset.city)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        useDashboard.getState().setWeather(data);
      })
      .catch(() => undefined);
  };

  let body;
  if (editing) {
    body = (
      <div className="space-y-2" data-no-drag>
        <div className="text-[10px] uppercase tracking-wide text-ink-muted">Quick cities</div>
        <div className="flex flex-wrap gap-1">
          {CITY_PRESETS.map((p) => (
            <button
              key={p.city}
              type="button"
              className="btn !py-0.5 !px-2 !text-[11px] !rounded-full"
              onClick={() => applyPreset(p)}
            >
              {p.city}
            </button>
          ))}
        </div>
        <input
          className="input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City label"
        />
        <div className="grid grid-cols-2 gap-2">
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
        </div>
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
            void fetch(
              `/api/weather?lat=${Number(lat)}&lon=${Number(lon)}&city=${encodeURIComponent(city)}`,
            )
              .then((r) => r.json())
              .then((data) => useDashboard.getState().setWeather(data))
              .catch(() => undefined);
          }}
        >
          Save location
        </button>
      </div>
    );
  } else if (!weather) {
    body = (
      <div className="h-full flex flex-col items-center justify-center text-center gap-1">
        <Cloud className="text-accent mb-0.5 opacity-60" size={22} />
        <div className="text-sm text-ink-muted">Fetching weather…</div>
        <div className="text-xs text-ink-muted flex items-center gap-1">
          <MapPin size={10} />
          {String(settings.city ?? DEFAULT_CITY.city)}
        </div>
      </div>
    );
  } else {
    body = (
      <div className="h-full flex flex-col justify-center gap-0.5 px-0.5">
        <div className="flex items-end justify-between gap-2">
          <div className="text-xl font-mono font-semibold tabular-nums leading-none tracking-tight">
            {Math.round(weather.temperature)}°
          </div>
          <Cloud className="text-accent shrink-0 mb-1" size={22} />
        </div>
        <div className="text-sm text-ink-muted">{weatherLabel(weather.weatherCode)}</div>
        <div className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
          <MapPin size={10} className="shrink-0" />
          <span className="truncate">{weather.city || String(settings.city ?? '')}</span>
        </div>
        <div className="text-[11px] text-ink-muted mt-1 tabular-nums">
          Wind {weather.windSpeed.toFixed(0)} km/h
          {weather.humidity != null ? ` · ${weather.humidity}% RH` : ''}
        </div>
      </div>
    );
  }

  return (
    <WidgetShell
      id={id}
      title="Weather"
      onSettings={() => setEditing((v) => !v)}
      allowScroll={editing}
    >
      {body}
    </WidgetShell>
  );
}
