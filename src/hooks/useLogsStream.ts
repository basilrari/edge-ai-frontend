"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  FlightLogEntry,
  LogWsMessage,
  MavlinkLogEntry,
} from "../components/types";
import { newRequestId } from "../lib/gateway";

function httpToWs(httpUrl: string): string {
  return httpUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
}

const MAX_FLIGHT = 500;
const MAX_MAVLINK = 800;

function appendCapped<T>(prev: T[], item: T, max: number): T[] {
  const next = [...prev, item];
  return next.length > max ? next.slice(next.length - max) : next;
}

async function fetchLogSnapshot(gatewayUrl: string): Promise<{
  flight: FlightLogEntry[];
  mavlink: MavlinkLogEntry[];
  httpError: string | null;
}> {
  const headers = { "x-request-id": newRequestId() };
  let flight: FlightLogEntry[] = [];
  let mavlink: MavlinkLogEntry[] = [];
  let httpError: string | null = null;

  try {
    const [flightRes, mavlinkRes] = await Promise.all([
      fetch(`${gatewayUrl}/drone/logs`, { headers }),
      fetch(`${gatewayUrl}/drone/logs/mavlink`, { headers }),
    ]);
    if (flightRes.ok) {
      const data = (await flightRes.json()) as { entries?: FlightLogEntry[] };
      flight = data.entries ?? [];
    } else {
      httpError = `flight logs HTTP ${flightRes.status}`;
    }
    if (mavlinkRes.ok) {
      const data = (await mavlinkRes.json()) as { entries?: MavlinkLogEntry[] };
      mavlink = data.entries ?? [];
    } else if (!httpError) {
      httpError = `mavlink logs HTTP ${mavlinkRes.status}`;
    }
  } catch (e) {
    httpError = e instanceof Error ? e.message : "failed to load logs";
  }

  return { flight, mavlink, httpError };
}

export function useLogsStream(gatewayUrl: string): {
  flightEntries: FlightLogEntry[];
  mavlinkEntries: MavlinkLogEntry[];
  connected: boolean;
  error: string | null;
  reload: () => void;
  resetEntries: () => void;
} {
  const [flightEntries, setFlightEntries] = useState<FlightLogEntry[]>([]);
  const [mavlinkEntries, setMavlinkEntries] = useState<MavlinkLogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const connectedRef = useRef(false);

  const reload = useCallback(() => setRefreshNonce((n) => n + 1), []);

  const resetEntries = useCallback(() => {
    setFlightEntries([]);
    setMavlinkEntries([]);
    setError(null);
  }, []);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  useEffect(() => {
    const base = gatewayUrl.replace(/\/$/, "");
    const wsUrl = `${httpToWs(base)}/drone/logs/ws`;
    let active = true;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const loadHttp = async () => {
      const snap = await fetchLogSnapshot(base);
      if (!active) return;
      setFlightEntries(snap.flight);
      setMavlinkEntries(snap.mavlink);
      if (snap.httpError && !connectedRef.current) setError(snap.httpError);
    };

    void loadHttp();
    pollTimer = setInterval(() => {
      if (!connectedRef.current) void loadHttp();
    }, 5000);

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
            error?: string;
          };
          if (msg.detail || msg.error) {
            setError(msg.detail ?? msg.error ?? "logs stream error");
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
      if (pollTimer) clearInterval(pollTimer);
      socket?.close();
    };
  }, [gatewayUrl, refreshNonce]);

  return { flightEntries, mavlinkEntries, connected, error, reload, resetEntries };
}
