"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { StatusCard } from "../components/StatusCard";
import { HistoryTable } from "../components/HistoryTable";
import { PromptForm } from "../components/PromptForm";
import type {
  ApiResponse,
  DroneLinkInfo,
  DroneTelemetry,
  StatusResponse,
} from "../components/types";
import { DroneHud } from "../components/DroneHud";
import { LinkBadge } from "../components/LinkBadge";
import { FlightLogsModal } from "../components/FlightLogsModal";
import { motion } from "framer-motion";
import { Activity, ScrollText, SatelliteDish } from "lucide-react";

const LocationMapPicker = dynamic(
  () =>
    import("../components/LocationMapPicker").then((m) => m.LocationMapPicker),
  { ssr: false, loading: () => null }
);

const MissionMapPanel = dynamic(
  () =>
    import("../components/MissionMapPanel").then((m) => m.MissionMapPanel),
  { ssr: false, loading: () => null }
);

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000";

function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `fe-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function gatewayJsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-request-id": newRequestId(),
  };
}

interface HistoryEntry extends ApiResponse {
  timestamp: string;
}

export default function Page(): JSX.Element {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<DroneTelemetry | null>(null);
  const [latest, setLatest] = useState<ApiResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const [logsOpen, setLogsOpen] = useState(false);

  const gatewayUrl = useMemo(() => GATEWAY_URL, []);
  const droneLink: DroneLinkInfo | null = telemetry?.link ?? null;

  useEffect(() => {
    let active = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/status`, {
          headers: { "x-request-id": newRequestId() },
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as StatusResponse;
        if (active) {
          setStatus(data);
          setStatusError(null);
        }
      } catch (e) {
        if (active) {
          setStatusError(e instanceof Error ? e.message : "unknown error");
        }
      }
    };

    fetchStatus();
    const id = setInterval(fetchStatus, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/drone/telemetry`, {
          headers: { "x-request-id": newRequestId() },
        });
        if (!res.ok) return;
        const data = (await res.json()) as DroneTelemetry;
        if (active) setTelemetry(data);
      } catch {
        /* HUD optional when drone-http down */
      }
    };

    fetchTelemetry();
    const id = setInterval(fetchTelemetry, 2000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const onSendPrompt = async (prompt: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${GATEWAY_URL}/infer`, {
        method: "POST",
        headers: gatewayJsonHeaders(),
        body: JSON.stringify({ Infer: { prompt } }),
      });
      if (!res.ok) throw new Error(`infer status ${res.status}`);
      const data = (await res.json()) as ApiResponse;
      setLatest(data);
      setHistory((prev) =>
        [{ ...data, timestamp: new Date().toISOString() }, ...prev].slice(0, 10)
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleAppendFromMap = (snippet: string) => {
    setPromptValue((prev) => {
      const trimmed = prev.trimEnd();
      if (!trimmed) return snippet;
      return `${trimmed} ${snippet}`;
    });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-background text-foreground px-4 py-5 pb-8 sm:px-5 md:px-6 md:py-6 safe-area-padding">
      <motion.div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.16),_transparent_55%)] opacity-70" />

      <motion.div className="relative mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 sm:gap-5">
        <motion.header
          className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold md:text-2xl">
                Jetson SAR Gateway
              </h1>
              <p className="text-xs text-slate-400">Drone command & telemetry</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <LinkBadge link={droneLink} />
            <div className="flex min-w-0 items-center gap-2 rounded-full border border-slate-600/60 bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-400">
              <SatelliteDish className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-mono">{gatewayUrl}</span>
            </div>
            <button
              type="button"
              className="outline flex items-center gap-1.5 text-xs"
              onClick={() => setLogsOpen(true)}
            >
              <ScrollText className="h-3.5 w-3.5" />
              Flight logs
            </button>
          </div>
        </motion.header>

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="min-w-0 space-y-4 lg:col-span-2">
            <motion.div className="card">
              <DroneHud telemetry={telemetry} />
            </motion.div>

            <motion.div className="card">
              <MissionMapPanel gatewayUrl={gatewayUrl} telemetry={telemetry} />
            </motion.div>

            <motion.div className="card">
              <PromptForm
                onSend={onSendPrompt}
                loading={loading}
                error={error}
                value={promptValue}
                onChange={setPromptValue}
                locationPicker={
                  <LocationMapPicker
                    inline
                    gatewayBaseUrl={gatewayUrl}
                    onAppendToPrompt={handleAppendFromMap}
                  />
                }
              />
            </motion.div>

            <motion.div className="card">
              <HistoryTable entries={history} />
            </motion.div>
          </div>

          <div className="min-w-0">
            <motion.div className="card sticky top-4">
              <StatusCard
                status={status}
                latest={latest}
                statusError={statusError}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <FlightLogsModal
        open={logsOpen}
        onClose={() => setLogsOpen(false)}
        gatewayUrl={gatewayUrl}
      />
    </main>
  );
}
