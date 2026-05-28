"use client";

import { useEffect, useState } from "react";
import type { DroneTelemetry } from "../components/types";

function httpToWs(httpUrl: string): string {
  return httpUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
}

export function useDroneTelemetryWs(gatewayUrl: string): {
  telemetry: DroneTelemetry | null;
  connected: boolean;
} {
  const [telemetry, setTelemetry] = useState<DroneTelemetry | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const base = gatewayUrl.replace(/\/$/, "");
    const wsUrl = `${httpToWs(base)}/drone/ws`;
    let active = true;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!active) return;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (active) setConnected(true);
      };

      socket.onmessage = (ev) => {
        if (!active) return;
        try {
          const data = JSON.parse(String(ev.data)) as DroneTelemetry & {
            error?: string;
          };
          if (!data.error) setTelemetry(data);
        } catch {
          /* ignore malformed */
        }
      };

      socket.onclose = () => {
        if (active) {
          setConnected(false);
          retryTimer = setTimeout(connect, 2000);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [gatewayUrl]);

  return { telemetry, connected };
}
