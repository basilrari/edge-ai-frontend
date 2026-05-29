export type TimezoneMode = "utc" | "auto" | "location" | "custom";

export const TIMEZONE_SETTINGS_KEY = "edge-ai.timezone";

export interface TimezoneSettings {
  mode: TimezoneMode;
  /** IANA zone when mode is `custom`. */
  customTimeZone: string;
}

export const DEFAULT_TIMEZONE_SETTINGS: TimezoneSettings = {
  mode: "utc",
  customTimeZone: "UTC",
};

/** Common operator zones; browser `Intl` also lists more via supportedValuesOf when available. */
export const COMMON_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Taipei",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Pacific/Auckland",
] as const;

export function loadTimezoneSettings(): TimezoneSettings {
  if (typeof window === "undefined") return DEFAULT_TIMEZONE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(TIMEZONE_SETTINGS_KEY);
    if (!raw) return DEFAULT_TIMEZONE_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<TimezoneSettings>;
    const mode = parsed.mode;
    if (
      mode !== "utc" &&
      mode !== "auto" &&
      mode !== "location" &&
      mode !== "custom"
    ) {
      return DEFAULT_TIMEZONE_SETTINGS;
    }
    return {
      mode,
      customTimeZone:
        typeof parsed.customTimeZone === "string" && parsed.customTimeZone
          ? parsed.customTimeZone
          : "UTC",
    };
  } catch {
    return DEFAULT_TIMEZONE_SETTINGS;
  }
}

export function saveTimezoneSettings(settings: TimezoneSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TIMEZONE_SETTINGS_KEY, JSON.stringify(settings));
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Rough IANA zone from coordinates (15° longitude ≈ 1 hour). */
export function timeZoneFromCoordinates(_lat: number, lng: number): string {
  const offsetHours = Math.round(lng / 15);
  if (offsetHours === 0) return "UTC";
  // Etc/GMT labels use inverted sign vs UTC offset.
  const sign = offsetHours > 0 ? "-" : "+";
  return `Etc/GMT${sign}${Math.abs(offsetHours)}`;
}

export function resolveTimeZone(
  settings: TimezoneSettings,
  location: { lat: number; lng: number } | null
): string {
  switch (settings.mode) {
    case "utc":
      return "UTC";
    case "auto":
      return browserTimeZone();
    case "location":
      return location
        ? timeZoneFromCoordinates(location.lat, location.lng)
        : browserTimeZone();
    case "custom":
      return settings.customTimeZone || "UTC";
    default:
      return "UTC";
  }
}

export function timezoneModeLabel(mode: TimezoneMode): string {
  switch (mode) {
    case "utc":
      return "UTC (GMT+0)";
    case "auto":
      return "Auto (browser)";
    case "location":
      return "Auto (from location)";
    case "custom":
      return "Custom zone";
  }
}

export function getTimezoneLabel(timeZone: string): string {
  if (timeZone === "UTC") return "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

export function formatClockTime(
  date: Date,
  timeZone: string,
  hour12 = true
): string {
  return date.toLocaleTimeString("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12,
  });
}

export function formatLogTime(tsMs: number, timeZone: string): string {
  return new Date(tsMs).toLocaleTimeString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatLogDate(tsMs: number, timeZone: string): string {
  return new Date(tsMs).toLocaleDateString("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
