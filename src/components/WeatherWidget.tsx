"use client";

import { useEffect, useState } from "react";

/* ── WMO weather code → icon SVG ── */
function WeatherIcon({ code }: { code: number }) {
  const size = 16;
  const stroke = "currentColor";
  const sw = 1.5;

  // Clear
  if (code === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
        <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
      </svg>
    );
  }

  // Partly cloudy
  if (code >= 1 && code <= 3) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
        <circle cx="8" cy="8" r="3" />
        <line x1="8" y1="1" x2="8" y2="3" />
        <line x1="3" y1="8" x2="1" y2="8" />
        <line x1="4.05" y1="4.05" x2="2.64" y2="2.64" />
        <path d="M17.5 19H9a4.5 4.5 0 0 1-.5-8.97A5 5 0 0 1 18 12h.5a3.5 3.5 0 0 1 0 7z" />
      </svg>
    );
  }

  // Fog
  if (code === 45 || code === 48) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
        <line x1="3" y1="8" x2="21" y2="8" />
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="3" y1="16" x2="21" y2="16" />
        <line x1="7" y1="20" x2="17" y2="20" />
      </svg>
    );
  }

  // Rain / drizzle
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
        <path d="M16 13V6a4 4 0 0 0-8 0v1H6.5a3.5 3.5 0 0 0 0 7H17a3 3 0 0 0 0-6h-1z" />
        <line x1="8" y1="18" x2="7" y2="22" />
        <line x1="12" y1="18" x2="11" y2="22" />
        <line x1="16" y1="18" x2="15" y2="22" />
      </svg>
    );
  }

  // Snow
  if (code >= 71 && code <= 77) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
        <path d="M16 13V6a4 4 0 0 0-8 0v1H6.5a3.5 3.5 0 0 0 0 7H17a3 3 0 0 0 0-6h-1z" />
        <circle cx="8" cy="20" r="1" fill={stroke} />
        <circle cx="12" cy="19" r="1" fill={stroke} />
        <circle cx="16" cy="21" r="1" fill={stroke} />
      </svg>
    );
  }

  // Thunderstorm
  if (code >= 95) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 13V6a4 4 0 0 0-8 0v1H6.5a3.5 3.5 0 0 0 0 7H17a3 3 0 0 0 0-6h-1z" />
        <polyline points="13 16 11 20 15 20 12 24" />
      </svg>
    );
  }

  // Fallback — overcast cloud
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
      <path d="M17.5 19H9a4.5 4.5 0 0 1-.5-8.97A5 5 0 0 1 18 12h.5a3.5 3.5 0 0 1 0 7z" />
    </svg>
  );
}

/* ── Weather code → hover color ── */
function weatherColor(code: number): string {
  if (code === 0) return '#f59e0b';                    // clear → amber
  if (code >= 1 && code <= 3) return '#f97316';        // partly cloudy → orange
  if (code === 45 || code === 48) return '#94a3b8';    // fog → slate
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '#3b82f6'; // rain → blue
  if (code >= 71 && code <= 77) return '#7dd3fc';      // snow → sky
  if (code >= 95) return '#eab308';                    // thunder → yellow
  return '#71717a';                                     // fallback
}

/* ── Wind direction helper ── */
function degToCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

/* ── Format time as military HHMM ── */
function getMilitaryTime(): { hours: string; minutes: string } {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  return {
    hours: String(now.getHours()).padStart(2, "0"),
    minutes: String(now.getMinutes()).padStart(2, "0"),
  };
}

interface WeatherData {
  temp: number;
  weatherCode: number;
  windSpeed: number;
  windDir: number;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [time, setTime] = useState(getMilitaryTime());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=12.8378&longitude=80.2273&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=Asia/Kolkata"
        );
        const data = await res.json();
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
          windSpeed: Math.round(data.current.wind_speed_10m),
          windDir: data.current.wind_direction_10m,
        });
        setLoaded(true);
      } catch {
        // Silently fail — widget just won't show
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // 10 min
    return () => clearInterval(interval);
  }, []);

  // Update clock every 30s
  useEffect(() => {
    const tick = setInterval(() => setTime(getMilitaryTime()), 30_000);
    return () => clearInterval(tick);
  }, []);

  if (!loaded || !weather) {
    // Skeleton placeholder — stacked
    return (
      <div className="weather-widget" style={{ opacity: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ width: 50, height: 6, background: "var(--grey-light)", opacity: 0.15, display: "block" }} />
          <span style={{ width: 80, height: 6, background: "var(--grey-light)", opacity: 0.15, display: "block" }} />
          <span style={{ width: 60, height: 6, background: "var(--grey-light)", opacity: 0.15, display: "block" }} />
          <span style={{ width: 70, height: 6, background: "var(--grey-light)", opacity: 0.15, display: "block" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <span className="weather-icon-wrapper" style={{ '--icon-color': weatherColor(weather.weatherCode) } as React.CSSProperties}>
          <WeatherIcon code={weather.weatherCode} />
        </span>
        <span style={{ fontWeight: 500, color: "var(--fg)" }}>
          {weather.temp}°C
        </span>
      </div>
      <div className="weather-wind" style={{ marginBottom: 1 }}>
        <span className="wind-part">WIND</span>
        <span className="wind-part">{weather.windSpeed} KM/H</span>
        <span className="wind-part">{degToCardinal(weather.windDir)}</span>
      </div>
      <div style={{ marginBottom: 1 }}>
        {time.hours}
        <span className="blink-colon">:</span>
        {time.minutes} HRS IST
      </div>
      <div style={{ color: "var(--grey-dark)", fontSize: "0.5rem" }}>
        12.83°N&nbsp;&nbsp;80.22°E
      </div>
    </div>
  );
}
