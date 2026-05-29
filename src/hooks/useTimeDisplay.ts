"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOperatorLocation } from "./useOperatorLocation";
import {
  DEFAULT_TIMEZONE_SETTINGS,
  formatClockTime,
  formatLogDate,
  formatLogTime,
  getTimezoneLabel,
  loadTimezoneSettings,
  resolveTimeZone,
  saveTimezoneSettings,
  type TimezoneSettings,
} from "../lib/timeDisplay";

export function useTimeDisplay(): {
  settings: TimezoneSettings;
  setSettings: (next: TimezoneSettings) => void;
  timeZone: string;
  label: string;
  formatClock: (date?: Date) => string;
  formatLogTime: (tsMs: number) => string;
  formatLogDate: (tsMs: number) => string;
  locationAvailable: boolean;
  locationError: string | null;
} {
  const [settings, setSettingsState] = useState<TimezoneSettings>(
    DEFAULT_TIMEZONE_SETTINGS
  );
  const { position, error: locationError } = useOperatorLocation();

  useEffect(() => {
    setSettingsState(loadTimezoneSettings());
  }, []);

  const setSettings = useCallback((next: TimezoneSettings) => {
    setSettingsState(next);
    saveTimezoneSettings(next);
  }, []);

  const timeZone = useMemo(
    () => resolveTimeZone(settings, position),
    [settings, position]
  );
  const label = useMemo(() => getTimezoneLabel(timeZone), [timeZone]);

  const formatClock = useCallback(
    (date = new Date()) => formatClockTime(date, timeZone),
    [timeZone]
  );

  const formatLogTimeLocal = useCallback(
    (tsMs: number) => formatLogTime(tsMs, timeZone),
    [timeZone]
  );

  const formatLogDateLocal = useCallback(
    (tsMs: number) => formatLogDate(tsMs, timeZone),
    [timeZone]
  );

  return {
    settings,
    setSettings,
    timeZone,
    label,
    formatClock,
    formatLogTime: formatLogTimeLocal,
    formatLogDate: formatLogDateLocal,
    locationAvailable: position != null,
    locationError,
  };
}
