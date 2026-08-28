"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  mapModelPayload,
  EMPTY_MODEL_VIEW,
  type ModelDashboardView,
} from "../lib/modelPayload";
import {
  modelServerLiveWsUrl,
  modelServerStatusUrl,
} from "../lib/modelServer";
import type { ModelServerPayload } from "../types/modelServer";

const LOG_CAP = 50;

function httpToWsIdle(tool: string | undefined, inferenceEnabled: boolean | undefined): boolean {
  return !inferenceEnabled || tool === "idle";
}

export function useModelServer(): {
  view: ModelDashboardView;
  connected: boolean;
  error: string | null;
  logs: string[];
} {
  const [payload, setPayload] = useState<ModelServerPayload | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const appendLog = (line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setLogs((prev) => {
      const next = [...prev, `[${stamp}] ${line}`];
      return next.length > LOG_CAP ? next.slice(-LOG_CAP) : next;
    });
  };

  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const apply = (data: ModelServerPayload) => {
      if (!active) return;
      setPayload(data);
      setConnected(true);
      setError(null);
      const line = data.log || data.message;
      if (line) appendLog(line);
    };

    const pollStatus = async () => {
      try {
        const res = await fetch(modelServerStatusUrl(), { cache: "no-store" });
        if (!res.ok) {
          if (active) {
            setConnected(false);
            setError(`model status ${res.status}`);
          }
          return;
        }
        const data = (await res.json()) as ModelServerPayload;
        apply(data);
        if (!httpToWsIdle(data.active_tool, data.inference_enabled)) {
          connectWs();
        } else {
          disconnectWs();
        }
      } catch (e) {
        if (active) {
          setConnected(false);
          setError(e instanceof Error ? e.message : "model server unreachable");
        }
      }
    };

    const disconnectWs = () => {
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };

    const connectWs = () => {
      if (!active) return;
      const existing = wsRef.current;
      if (
        existing &&
        (existing.readyState === WebSocket.OPEN ||
          existing.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }
      disconnectWs();
      const ws = new WebSocket(modelServerLiveWsUrl());
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(String(ev.data)) as ModelServerPayload;
          apply(data);
        } catch {
          /* ignore malformed */
        }
      };
      ws.onclose = () => {
        wsRef.current = null;
        if (!active) return;
        retryTimer = setTimeout(connectWs, 2000);
      };
      ws.onerror = () => ws.close();
    };

    void pollStatus();
    pollTimer = setInterval(() => {
      void pollStatus();
    }, 2000);

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (pollTimer) clearInterval(pollTimer);
      disconnectWs();
    };
  }, []);

  const view = useMemo(
    () => (payload ? mapModelPayload(payload) : EMPTY_MODEL_VIEW),
    [payload]
  );

  return { view, connected, error, logs };
}
