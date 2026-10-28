import "server-only";

import { getPlaces, type PlaceRow } from "@/lib/supabase/places";

const WEATHER_QUESTION_PATTERN = /\b(?:weather|forecast|temperature|rain(?:fall)?|snow(?:fall)?|wind|sunny|cloudy|storm|precipitation|humidity)\b/i;
const WEATHER_TEMPERATURE_QUESTION_PATTERN = /\bhow\s+(?:hot|cold|warm|freezing)\s+(?:will|would|is|was)\b|\b(?:will|would|is|was)\s+it\s+(?:hot|cold|warm|freezing)\b|\b(?:hot|cold|warm|freezing)\s+weather\b/i;
const TIME_ZONE = "Asia/Karachi";
const MAX_FORECAST_DAYS_AHEAD = 15;
const FIRST_HISTORICAL_DATE = "1940-01-01";
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};
const CHITRAL: WeatherLocation = { name: "Chitral", latitude: 35.85, longitude: 71.79 };
const DAILY_VARIABLES = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max";
const CURRENT_VARIABLES = "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation";

export type WeatherLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

export type WeatherLocationResolution = {
  location: WeatherLocation | null;
  unsupportedName: string | null;
};

type WeatherResult = { answer: string; sources: [] };
type PlaceCoordinates = Pick<PlaceRow, "name" | "latitude" | "longitude">;
type WeatherDependencies = {
  now?: Date;
  fetcher?: typeof fetch;
  resolveLocation?: (message: string) => Promise<WeatherLocationResolution>;
  places?: PlaceCoordinates[];
};

type OpenMeteoResponse = {
  error?: boolean;
  current?: Record<string, unknown>;
  daily?: Record<string, unknown>;
};

export function isWeatherQuestion(message: string): boolean {
  return WEATHER_QUESTION_PATTERN.test(message) || WEATHER_TEMPERATURE_QUESTION_PATTERN.test(message);
}

export async function answerWeatherQuestion(message: string, dependencies: WeatherDependencies = {}): Promise<WeatherResult> {
  const now = dependencies.now ?? new Date();
  const dateRequest = parseRequestedDate(message, now);
  if (dateRequest.error) {
    return { answer: `${dateRequest.error} Source: Open-Meteo weather APIs.`, sources: [] };
  }

  let resolution: WeatherLocationResolution;
  try {
    resolution = dependencies.resolveLocation
      ? await dependencies.resolveLocation(message)
      : await resolveWeatherLocation(message, dependencies.places);
  } catch {
    resolution = { location: null, unsupportedName: getExplicitLocationName(message) ?? "the requested location" };
  }

  if (!resolution.location) {
    return {
      answer: `I cannot safely resolve ${resolution.unsupportedName ?? "that location"} to a supported CHAYTHRAAR place. Requested date: ${dateRequest.date}. Source: Open-Meteo weather APIs were not queried.`,
      sources: [],
    };
  }

  const today = getDateInTimeZone(now, TIME_ZONE);
  const dayOffset = differenceInDays(dateRequest.date, today);
  if (dayOffset > MAX_FORECAST_DAYS_AHEAD) {
    return {
      answer: `I cannot provide a forecast for ${resolution.location.name} on ${dateRequest.date}; the Open-Meteo Forecast API supports dates up to ${MAX_FORECAST_DAYS_AHEAD} days ahead. Requested date: ${dateRequest.date}. Source: Open-Meteo Forecast API.`,
      sources: [],
    };
  }
  if (dayOffset < 0 && dateRequest.date < FIRST_HISTORICAL_DATE) {
    return {
      answer: `I cannot provide historical weather for ${resolution.location.name} on ${dateRequest.date}; the Open-Meteo Historical Weather API starts on ${FIRST_HISTORICAL_DATE}. Requested date: ${dateRequest.date}. Source: Open-Meteo Historical Weather API.`,
      sources: [],
    };
  }

  const fetcher = dependencies.fetcher ?? fetch;
  try {
    if (dayOffset === 0) {
      const data = await fetchOpenMeteo(fetcher, buildForecastUrl(resolution.location, dateRequest.date, "current"));
      return { answer: formatCurrentAnswer(data, resolution.location, dateRequest.date), sources: [] };
    }

    const isFuture = dayOffset > 0;
    const endpoint = isFuture
      ? buildForecastUrl(resolution.location, dateRequest.date, "daily")
      : buildHistoricalUrl(resolution.location, dateRequest.date);
    const data = await fetchOpenMeteo(fetcher, endpoint);
    return {
      answer: formatDailyAnswer(data, resolution.location, dateRequest.date, isFuture),
      sources: [],
    };
  } catch {
    const source = dayOffset < 0 ? "Open-Meteo Historical Weather API" : "Open-Meteo Forecast API";
    return {
      answer: `Weather data for ${resolution.location.name} on ${dateRequest.date} is temporarily unavailable. Requested date: ${dateRequest.date}. Source: ${source}.`,
      sources: [],
    };
  }
}

async function resolveWeatherLocation(message: string, knownPlaces?: PlaceCoordinates[]): Promise<WeatherLocationResolution> {
  const explicitName = getExplicitLocationName(message);
  if (!explicitName) return { location: CHITRAL, unsupportedName: null };

  if (/^chitral(?:\s+town)?$/i.test(explicitName)) {
    return { location: CHITRAL, unsupportedName: null };
  }

  const { places, error } = knownPlaces
    ? { places: knownPlaces, error: null }
    : await getPlaces();
  if (error) return { location: null, unsupportedName: explicitName };
  const place = places.find((candidate) => normalizeLocationName(candidate.name) === normalizeLocationName(explicitName));
  if (!place || !isSupportedPlace(place)) return { location: null, unsupportedName: explicitName };

  return {
    location: { name: place.name, latitude: place.latitude!, longitude: place.longitude! },
    unsupportedName: null,
  };
}

function getExplicitLocationName(message: string): string | null {
  const withoutDates = removeRecognizedDatePhrases(message);
  const match = /\b(?:in|at|near|around)\s+([^,?.!;]+)/i.exec(withoutDates)
    ?? /\bfor\s+([^,?.!;]+)/i.exec(withoutDates);
  if (!match) return null;
  const candidate = match[1]
    .split(/\b(?:for|on|during|in|at|near|around)\b/i)[0]
    .trim();
  return candidate || null;
}

function removeRecognizedDatePhrases(message: string): string {
  const months = "january|february|march|april|may|june|july|august|september|october|november|december";
  const weekdayPattern = WEEKDAYS.join("|");
  const numberPattern = "\\d{1,3}|zero|one|two|three|four|five|six|seven|eight|nine|ten|a|an";
  return message
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(new RegExp(`\\b(?:${months})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b`, "gi"), " ")
    .replace(new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${months})(?:,?\\s+\\d{4})?\\b`, "gi"), " ")
    .replace(new RegExp(`\\b(?:next|this|last)\\s+(?:${weekdayPattern}|week|weekend|month|year|day)\\b`, "gi"), " ")
    .replace(new RegExp(`\\b(?:in|within)\\s+(?:${numberPattern})\\s+(?:days?|weeks?|months?|years?|fortnights?)\\b`, "gi"), " ")
    .replace(new RegExp(`\\b(?:${numberPattern})\\s+(?:days?|weeks?|months?|years?)\\s+(?:ago|from\\s+now|ahead)\\b`, "gi"), " ")
    .replace(/\b(?:today|tonight|tomorrow|yesterday|now|currently|this\s+morning|this\s+afternoon|this\s+evening)\b/gi, " ");
}

function isSupportedPlace(place: PlaceCoordinates): boolean {
  return typeof place.latitude === "number"
    && Number.isFinite(place.latitude)
    && place.latitude >= 34
    && place.latitude <= 37
    && typeof place.longitude === "number"
    && Number.isFinite(place.longitude)
    && place.longitude >= 70
    && place.longitude <= 74;
}

function normalizeLocationName(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("en");
}

function parseRequestedDate(message: string, now: Date): { date: string; error?: string } {
  const today = getDateInTimeZone(now, TIME_ZONE);
  const isoDate = /\b(\d{4}-\d{2}-\d{2})\b/.exec(message)?.[1];
  if (isoDate) {
    return isValidDate(isoDate)
      ? { date: isoDate }
      : { date: isoDate, error: `I could not use ${isoDate} because it is not a valid calendar date. Requested date: ${isoDate}.` };
  }

  const monthDate = parseNamedDate(message, Number(today.slice(0, 4)));
  if (monthDate) {
    return isValidDate(monthDate)
      ? { date: monthDate }
      : { date: monthDate, error: `I could not use ${monthDate} because it is not a valid calendar date. Requested date: ${monthDate}.` };
  }

  if (/\b(?:tomorrow)\b/i.test(message)) return { date: addDays(today, 1) };
  if (/\b(?:yesterday)\b/i.test(message)) return { date: addDays(today, -1) };
  const weekdayDate = /\b(next|this|last)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i.exec(message);
  if (weekdayDate) {
    const currentWeekday = new Date(`${today}T00:00:00.000Z`).getUTCDay();
    const targetWeekday = WEEKDAYS.indexOf(weekdayDate[2].toLowerCase());
    const direction = weekdayDate[1].toLowerCase();
    const forward = (targetWeekday - currentWeekday + 7) % 7;
    const offset = direction === "last" ? (forward === 0 ? -7 : forward - 7) : direction === "next" ? (forward === 0 ? 7 : forward) : forward;
    return { date: addDays(today, offset) };
  }

  const relativeDays = new RegExp(`\\b(?:in\\s+(${relativeNumberPattern()})\\s+days?|(${relativeNumberPattern()})\\s+days?\\s+(ago|from\\s+now|ahead))\\b`, "i").exec(message);
  if (relativeDays) {
    const amount = parseRelativeNumber(relativeDays[1] ?? relativeDays[2]);
    if (amount > 366) return { date: today, error: `I cannot interpret that date offset. Requested date: ${today}.` };
    return { date: addDays(today, relativeDays[3]?.toLowerCase() === "ago" ? -amount : amount) };
  }
  if (/\bnext\s+week\b/i.test(message)) return { date: addDays(today, 7) };
  if (/\blast\s+week\b/i.test(message)) return { date: addDays(today, -7) };
  if (/\b(?:today|tonight|now|currently)\b/i.test(message)) return { date: today };
  if (hasUnparsedDatePhrase(message)) {
    return { date: today, error: "I could not reliably interpret the requested date. Please provide a specific date, such as YYYY-MM-DD." };
  }
  return { date: today };
}

function relativeNumberPattern(): string {
  return "\\d{1,3}|zero|one|two|three|four|five|six|seven|eight|nine|ten";
}

function parseRelativeNumber(value: string): number {
  return /^\d+$/.test(value) ? Number(value) : NUMBER_WORDS[value.toLowerCase()] ?? Number.NaN;
}

function hasUnparsedDatePhrase(message: string): boolean {
  const weekdays = WEEKDAYS.join("|");
  const months = "january|february|march|april|may|june|july|august|september|october|november|december";
  return new RegExp(`\\b(?:${weekdays})\\b`, "i").test(message)
    || new RegExp(`\\b(?:next|this|last)\\s+(?:day|week|weekend|month|year)\\b`, "i").test(message)
    || /\b(?:in|within)\s+(?:(?:a|an)\s+)?(?:few|couple(?:\s+of)?|several|\d+|[a-z]+)\s+(?:days?|weeks?|months?|years?|fortnights?)\b/i.test(message)
    || new RegExp(`\\b(?:on|for)\\s+(?:${months})\\s+\\d{1,2}(?:st|nd|rd|th)?\\b`, "i").test(message)
    || /\b(?:on|for)\s+(?:the\s+)?\d{1,2}(?:st|nd|rd|th)?\s+[a-z]{3,9}\b/i.test(message)
    || /\b(?:on|for)\s+(?:the\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}\b/i.test(message)
    || /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/.test(message)
    || /\b(?:ago|from\s+now|ahead)\b/i.test(message);
}

function parseNamedDate(message: string, currentYear: number): string | null {
  const months = "january february march april may june july august september october november december".split(" ");
  const monthPattern = months.join("|");
  const yearPart = "(?:[,]?\\s+(\\d{4}))?";
  const monthFirst = new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?${yearPart}\\b`, "i").exec(message);
  const dayFirst = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})${yearPart}\\b`, "i").exec(message);
  const match = monthFirst ?? dayFirst;
  if (!match) return null;
  const monthName = monthFirst ? match[1] : match[2];
  const day = monthFirst ? match[2] : match[1];
  // Yearless named dates use the current Asia/Karachi year; they are not rolled forward.
  const year = match[3] ?? String(currentYear);
  const month = months.indexOf(monthName.toLowerCase()) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
}

function getDateInTimeZone(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value;
}

function addDays(value: string, amount: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function differenceInDays(first: string, second: string): number {
  return (Date.parse(`${first}T00:00:00.000Z`) - Date.parse(`${second}T00:00:00.000Z`)) / 86_400_000;
}

function buildForecastUrl(location: WeatherLocation, date: string, mode: "current" | "daily"): string {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  addLocationParams(url, location);
  url.searchParams.set("timezone", TIME_ZONE);
  if (mode === "current") {
    url.searchParams.set("current", CURRENT_VARIABLES);
  } else {
    url.searchParams.set("daily", DAILY_VARIABLES);
    url.searchParams.set("start_date", date);
    url.searchParams.set("end_date", date);
  }
  return url.toString();
}

function buildHistoricalUrl(location: WeatherLocation, date: string): string {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  addLocationParams(url, location);
  url.searchParams.set("daily", DAILY_VARIABLES);
  url.searchParams.set("start_date", date);
  url.searchParams.set("end_date", date);
  url.searchParams.set("timezone", TIME_ZONE);
  return url.toString();
}

function addLocationParams(url: URL, location: WeatherLocation): void {
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
}

async function fetchOpenMeteo(fetcher: typeof fetch, url: string): Promise<OpenMeteoResponse> {
  const response = await fetcher(url, { signal: AbortSignal.timeout(10000), cache: "no-store" });
  if (!response.ok) throw new Error("Open-Meteo request failed.");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Open-Meteo returned invalid data.");
  const result = data as OpenMeteoResponse;
  if (result.error) throw new Error("Open-Meteo returned an API error.");
  return result;
}

function formatCurrentAnswer(data: OpenMeteoResponse, location: WeatherLocation, date: string): string {
  const current = data.current;
  if (!current || !isFiniteNumber(current.temperature_2m) || !isFiniteNumber(current.weather_code)) {
    throw new Error("Open-Meteo current conditions were incomplete.");
  }
  const details = [
    `${Math.round(current.temperature_2m)}°C`,
    getWeatherCondition(current.weather_code),
    isFiniteNumber(current.apparent_temperature) ? `feels like ${Math.round(current.apparent_temperature)}°C` : null,
    isFiniteNumber(current.wind_speed_10m) ? `wind ${Math.round(current.wind_speed_10m)} km/h` : null,
  ].filter((item): item is string => item !== null).join(", ");
  return `Current weather in ${location.name} on ${date}: ${details}. Requested date: ${date}. Source: Open-Meteo Forecast API (live current conditions).`;
}

function formatDailyAnswer(data: OpenMeteoResponse, location: WeatherLocation, date: string, isForecast: boolean): string {
  const daily = data.daily;
  const times = daily?.time;
  const index = Array.isArray(times) ? times.indexOf(date) : -1;
  if (index < 0
    || !isFiniteNumberAt(daily?.temperature_2m_max, index)
    || !isFiniteNumberAt(daily?.temperature_2m_min, index)
    || !isFiniteNumberAt(daily?.weather_code, index)) {
    throw new Error("Open-Meteo daily weather data was incomplete.");
  }

  const values = daily as Record<string, unknown>;
  const details = [
    getWeatherCondition((values.weather_code as number[])[index]),
    `high ${Math.round((values.temperature_2m_max as number[])[index])}°C`,
    `low ${Math.round((values.temperature_2m_min as number[])[index])}°C`,
    isFiniteNumberAt(values.precipitation_sum, index) ? `${(values.precipitation_sum as number[])[index]} mm precipitation` : null,
    isFiniteNumberAt(values.wind_speed_10m_max, index) ? `wind up to ${Math.round((values.wind_speed_10m_max as number[])[index])} km/h` : null,
  ].filter((item): item is string => item !== null).join(", ");

  if (isForecast) {
    return `Forecast for ${location.name} on ${date}: ${details}. Requested date: ${date}. Source: Open-Meteo Forecast API.`;
  }
  return `Historical reanalysis estimate for ${location.name} on ${date}: ${details}. This is not a direct observation from a local weather station. Requested date: ${date}. Source: Open-Meteo Historical Weather API.`;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isFiniteNumberAt(values: unknown, index: number): boolean {
  return Array.isArray(values) && isFiniteNumber(values[index]);
}

function getWeatherCondition(value: number): string {
  if (value === 0) return "clear sky";
  if (value === 1 || value === 2) return "partly cloudy";
  if (value === 3) return "overcast";
  if (value === 45 || value === 48) return "fog";
  if (value >= 51 && value <= 57) return "drizzle";
  if (value >= 61 && value <= 67) return "rain";
  if (value >= 71 && value <= 77) return "snowfall";
  if (value >= 80 && value <= 82) return "rain showers";
  if (value >= 85 && value <= 86) return "snow showers";
  if (value === 95 || value === 96 || value === 99) return "thunderstorm";
  return "condition unavailable";
}