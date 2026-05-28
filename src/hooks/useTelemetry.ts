"use client";

import { useEffect, useMemo, useState } from "react";
import type { DroneTelemetry } from "../components/types";
import { mapDroneTelemetryToHud } from "../lib/telemetryMap";
import type { Telemetry } from "../types/drone";
import { newRequestId } from "../lib/gateway";
import { useDroneTelemetryWs } from "./useDroneTelemetryWs";

export function useTelemetry(gatewayUrl: string): {
  telemetry: Telemetry;
  live: DroneTelemetry | null;
  connected: boolean;
  secondsSinceUpdate: number;
} {
  const { telemetry: wsTelem, connected: wsConnected } =
    useDroneTelemetryWs(gatewayUrl);
  const [restTelem, setRestTelem] = useState<DroneTelemetry | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`${gatewayUrl}/drone/telemetry`, {
          headers: { "x-request-id": newRequestId() },
        });
        if (!res.ok) return;
        const data = (await res.json()) as DroneTelemetry;
        if (active) setRestTelem(data);
      } catch {
        /* WS is primary */
      }
    };

    load();
    const id = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [gatewayUrl]);

  const live = wsTelem ?? restTelem;
  const connected = wsConnected || (restTelem?.ok ?? false);

  const telemetry = useMemo(
    () => mapDroneTelemetryToHud(live),
    [live]
  );

  const secondsSinceUpdate = useMemo(() => {
    if (!telemetry.lastUpdateMs) return 0;
    return Math.max(0, Math.round((Date.now() - telemetry.lastUpdateMs) / 1000));
  }, [telemetry.lastUpdateMs, live?.ts_ms]);

  return { telemetry, live, connected, secondsSinceUpdate };
}
