"use client";

import { useEffect, useState } from "react";
import { CloudSun, LoaderCircle, Thermometer, Wind } from "lucide-react";

type WeatherResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    wind_speed_10m_max?: number[];
  };
};

type WeatherState = {
  status: "loading" | "ready" | "error";
  data: WeatherResponse | null;
  error: string | null;
};

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast?latitude=35.85&longitude=71.79&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=Asia%2FKarachi&forecast_days=5";

export function ChitralWeather() {
  const [weather, setWeather] = useState<WeatherState>({ status: "loading", data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      try {
        const response = await fetch(OPEN_METEO_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Weather service returned HTTP ${response.status}.`);
        const data = await response.json() as WeatherResponse;
        if (!data.current || !data.daily?.time?.length) throw new Error("Weather data is unavailable for Chitral.");
        setWeather({ status: "ready", data, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        setWeather({ status: "error", data: null, error: error instanceof Error ? error.message : "Weather data is unavailable." });
      }
    }

    void loadWeather();
    return () => controller.abort();
  }, []);

  return <section aria-labelledby="chitral-weather-heading" className="mb-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-sand)] p-5 shadow-[0_18px_60px_rgba(36,48,45,0.08)] sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between"><div className="flex min-w-56 flex-col justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-copper)]">Chitral weather</p><h2 id="chitral-weather-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">A five-day read of the valley.</h2></div>{weather.status === "ready" && weather.data?.current ? <CurrentWeather current={weather.data.current} /> : weather.status === "loading" ? <div className="mt-8 flex items-center gap-2 text-sm text-[var(--color-muted)]"><LoaderCircle className="size-4 animate-spin" />Loading current weather</div> : <div className="mt-8 rounded-xl border border-[var(--color-copper)]/25 bg-white/55 p-3 text-sm text-[var(--color-slate)]"><p className="font-semibold text-[var(--color-ink)]">Weather unavailable</p><p className="mt-1">{weather.error}</p></div>}</div><div className="min-w-0 flex-1">{weather.status === "ready" && weather.data?.daily ? <Forecast daily={weather.data.daily} /> : weather.status === "loading" ? <div className="grid gap-2 sm:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-xl bg-white/55" />)}</div> : <div className="flex h-full min-h-32 items-center justify-center rounded-xl border border-dashed border-[var(--color-line-strong)] text-sm text-[var(--color-muted)]">No forecast available right now.</div>}</div></div></section>;
}

function CurrentWeather({ current }: { current: NonNullable<WeatherResponse["current"]> }) {
  return <div className="mt-8"><div className="flex items-end gap-3"><CloudSun className="mb-1 size-9 text-[var(--color-copper)]" /><span className="text-5xl font-semibold tracking-[-0.06em] text-[var(--color-ink)]">{formatNumber(current.temperature_2m)}°</span><span className="pb-1 text-sm text-[var(--color-muted)]">Chitral</span></div><p className="mt-2 text-sm font-medium text-[var(--color-slate)]">{weatherCondition(current.weather_code)}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--color-muted)]"><span className="inline-flex items-center gap-1"><Thermometer className="size-3.5" />Feels {formatNumber(current.apparent_temperature)}°</span><span className="inline-flex items-center gap-1"><Wind className="size-3.5" />Wind {formatNumber(current.wind_speed_10m)} km/h</span></div></div>;
}

function Forecast({ daily }: { daily: NonNullable<WeatherResponse["daily"]> }) {
  const days = daily.time ?? [];
  return <div className="grid gap-2 sm:grid-cols-5">{days.map((date, index) => <div key={date} className="rounded-xl border border-white/80 bg-white/55 p-3"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-muted)]">{formatDay(date, index === 0)}</p><p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">{weatherCondition(daily.weather_code?.[index])}</p><div className="mt-2 flex items-center gap-2 text-sm"><span className="font-semibold text-[var(--color-ink)]">{formatNumber(daily.temperature_2m_max?.[index])}°</span><span className="text-[var(--color-muted)]">{formatNumber(daily.temperature_2m_min?.[index])}°</span></div><p className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-muted)]"><Wind className="size-3" />{formatNumber(daily.wind_speed_10m_max?.[index])} km/h</p></div>)}</div>;
}

function weatherCondition(code: number | undefined): string {
  const weatherCode = typeof code === "number" ? code : -1;
  if (weatherCode === 0) return "Clear sky";
  if (weatherCode === 1 || weatherCode === 2) return "Partly cloudy";
  if (weatherCode === 3) return "Overcast";
  if (weatherCode === 45 || weatherCode === 48) return "Foggy";
  if (weatherCode >= 51 && weatherCode <= 57) return "Drizzle";
  if (weatherCode >= 61 && weatherCode <= 67) return "Rain";
  if (weatherCode >= 71 && weatherCode <= 77) return "Snowfall";
  if (weatherCode >= 80 && weatherCode <= 82) return "Rain showers";
  if (weatherCode >= 85 && weatherCode <= 86) return "Snow showers";
  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) return "Thunderstorm";
  return "Condition unavailable";
}

function formatNumber(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value).toString() : "--";
}

function formatDay(date: string, isToday: boolean): string {
  if (isToday) return "Today";
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? "Day" : new Intl.DateTimeFormat("en", { weekday: "short" }).format(parsed);
}
