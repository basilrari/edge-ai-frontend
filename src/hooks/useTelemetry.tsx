"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DroneTelemetry } from "../components/types";
import { mapDroneTelemetryToHud, isFreshTelemetry } from "../lib/telemetryMap";
import type { Telemetry } from "../types/drone";
import { useDroneTelemetryWs } from "./useDroneTelemetryWs";

export type TelemetrySnapshot = {
  telemetry: Telemetry;
  live: DroneTelemetry | null;
  connected: boolean;
  secondsSinceUpdate: number | null;
};

const TelemetryContext = createContext<TelemetrySnapshot | null>(null);

function useTelemetryState(gatewayUrl: string): TelemetrySnapshot {
  const { telemetry: wsTelem, connected: wsConnected } =
    useDroneTelemetryWs(gatewayUrl);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const live = wsConnected ? wsTelem : null;
  const connected = isFreshTelemetry(live, nowMs);

  const telemetry = useMemo(
    () => mapDroneTelemetryToHud(live, nowMs, live),
    [live, nowMs]
  );

  const secondsSinceUpdate = useMemo(() => {
    if (telemetry.lastUpdateMs == null) return null;
    return Math.max(0, Math.round((nowMs - telemetry.lastUpdateMs) / 1000));
  }, [telemetry.lastUpdateMs, nowMs]);

  return { telemetry, live, connected, secondsSinceUpdate };
}

export function TelemetryProvider({
  gatewayUrl,
  children,
}: {
  gatewayUrl: string;
  children: ReactNode;
}): JSX.Element {
  const value = useTelemetryState(gatewayUrl);
  return (
    <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>
  );
}

/** Shared telemetry from AppShell `TelemetryProvider` (one WS per page). */
export function useTelemetry(): TelemetrySnapshot {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error("useTelemetry must be used within TelemetryProvider");
  }
  return ctx;
}
