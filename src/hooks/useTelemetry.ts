"use client";

import { useEffect, useMemo, useState } from "react";
import type { DroneTelemetry } from "../components/types";
import { mapDroneTelemetryToHud, isFreshTelemetry } from "../lib/telemetryMap";
import type { Telemetry } from "../types/drone";
import { newRequestId } from "../lib/gateway";
import { useDroneTelemetryWs } from "./useDroneTelemetryWs";

export function useTelemetry(gatewayUrl: string): {
  telemetry: Telemetry;
  live: DroneTelemetry | null;
  connected: boolean;
  secondsSinceUpdate: number | null;
} {
  const { telemetry: wsTelem, connected: wsConnected } =
    useDroneTelemetryWs(gatewayUrl);
  const [restTelem, setRestTelem] = useState<DroneTelemetry | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`${gatewayUrl}/drone/telemetry`, {
          headers: { "x-request-id": newRequestId() },
        });
        if (!res.ok) {
          if (active) setRestTelem(null);
          return;
        }
        const data = (await res.json()) as DroneTelemetry;
        if (active) setRestTelem(data);
      } catch {
        if (active) setRestTelem(null);
      }
    };

    load();
    const id = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [gatewayUrl]);

  const wsLive = wsConnected ? wsTelem : null;
  const hudLive = wsLive ?? restTelem;
  const connected = isFreshTelemetry(wsLive, nowMs);

  const telemetry = useMemo(
    () => mapDroneTelemetryToHud(hudLive, nowMs, wsLive),
    [hudLive, nowMs, wsLive]
  );

  const secondsSinceUpdate = useMemo(() => {
    if (telemetry.lastUpdateMs == null) return null;
    return Math.max(0, Math.round((nowMs - telemetry.lastUpdateMs) / 1000));
  }, [telemetry.lastUpdateMs, nowMs]);

  return { telemetry, live: hudLive, connected, secondsSinceUpdate };
}
