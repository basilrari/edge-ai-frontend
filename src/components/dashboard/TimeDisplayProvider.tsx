"use client";

import React, { createContext, useContext } from "react";
import { useTimeDisplay } from "../../hooks/useTimeDisplay";
import type { TimezoneSettings } from "../../lib/timeDisplay";

type TimeDisplayContextValue = ReturnType<typeof useTimeDisplay>;

const TimeDisplayContext = createContext<TimeDisplayContextValue | null>(null);

export function TimeDisplayProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const value = useTimeDisplay();
  return (
    <TimeDisplayContext.Provider value={value}>
      {children}
    </TimeDisplayContext.Provider>
  );
}

export function useTimeDisplayContext(): TimeDisplayContextValue {
  const ctx = useContext(TimeDisplayContext);
  if (!ctx) {
    throw new Error("useTimeDisplayContext must be used within TimeDisplayProvider");
  }
  return ctx;
}

export type { TimezoneSettings };
