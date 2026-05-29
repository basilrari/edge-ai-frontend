"use client";

import { useEffect, useState } from "react";
import type {
  FlightLogEntry,
  LogWsMessage,
  MavlinkLogEntry,
} from "../components/types";

function httpToWs(httpUrl: string): string {
  return httpUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
}

const MAX_FLIGHT = 500;
const MAX_MAVLINK = 800;

function appendCapped<T>(prev: T[], item: T, max: number): T[] {
  const next = [...prev, item];
  return next.length > max ? next.slice(next.length - max) : next;
}

export function useLogsStream(gatewayUrl: string): {
  flightEntries: FlightLogEntry[];
  mavlinkEntries: MavlinkLogEntry[];
  connected: boolean;
  error: string | null;
} {
  const [flightEntries, setFlightEntries] = useState<FlightLogEntry[]>([]);
  const [mavlinkEntries, setMavlinkEntries] = useState<MavlinkLogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = gatewayUrl.replace(/\/$/, "");
    const wsUrl = `${httpToWs(base)}/drone/logs/ws`;
    let active = true;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!active) return;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (active) {
          setConnected(true);
          setError(null);
        }
      };

      socket.onmessage = (ev) => {
        if (!active) return;
        try {
          const msg = JSON.parse(String(ev.data)) as LogWsMessage & {
            detail?: string;
          };
          if ("detail" in msg && msg.detail) {
            setError(msg.detail);
            return;
          }
          switch (msg.type) {
            case "snapshot":
              setFlightEntries(msg.flight ?? []);
              setMavlinkEntries(msg.mavlink ?? []);
              break;
            case "flight":
              setFlightEntries((prev) =>
                appendCapped(prev, msg.entry, MAX_FLIGHT)
              );
              break;
            case "mavlink":
              setMavlinkEntries((prev) =>
                appendCapped(prev, msg.entry, MAX_MAVLINK)
              );
              break;
            default:
              break;
          }
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

  return { flightEntries, mavlinkEntries, connected, error };
}
