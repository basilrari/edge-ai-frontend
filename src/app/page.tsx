"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { StatusCard } from "../components/StatusCard";
import { HistoryTable } from "../components/HistoryTable";
import { PromptForm } from "../components/PromptForm";
import { QuickActions } from "../components/QuickActions";
import type { ApiResponse, StatusResponse } from "../components/types";
import { ToolsPanel } from "../components/ToolsPanel";
import { ActiveCommandBar } from "../components/ActiveCommandBar";
import { motion } from "framer-motion";
import { Activity, SatelliteDish } from "lucide-react";

const LocationMapPicker = dynamic(
  () =>
    import("../components/LocationMapPicker").then((m) => m.LocationMapPicker),
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
  const [latest, setLatest] = useState<ApiResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState("");

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
          const msg = e instanceof Error ? e.message : "unknown error";
          setStatusError(msg);
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
      const entry: HistoryEntry = {
        ...data,
        timestamp: new Date().toISOString(),
      };
      setHistory((prev) => [entry, ...prev].slice(0, 10));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (prompt: string) => {
    setPromptValue(prompt);
  };

  const handleAppendFromMap = (snippet: string) => {
    setPromptValue((prev) => {
      const trimmed = prev.trimEnd();
      if (!trimmed) return snippet;
      return `${trimmed} ${snippet}`;
    });
  };

  const gatewayUrl = useMemo(() => GATEWAY_URL, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-background text-foreground px-4 py-5 pb-8 sm:px-5 md:px-6 md:py-6 safe-area-padding">
      <motion.div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.16),_transparent_55%)] opacity-70" />

      <motion.div className="relative mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 sm:gap-5">
        <motion.header
          className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div className="flex min-w-0 flex-shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/40">
              <Activity className="h-5 w-5" />
            </div>
            <motion.div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">
                Jetson SAR Gateway
              </h1>
              <p className="text-xs text-slate-400 md:text-sm">
                Mission control for search-and-rescue drone intelligence.
              </p>
            </motion.div>
          </motion.div>
          <div className="flex min-w-0 flex-shrink items-center justify-between gap-3 text-[11px] md:text-xs text-slate-400">
            <motion.div className="flex min-w-0 max-w-full items-center gap-2 rounded-full border border-cyan-500/40 bg-slate-900/70 px-3 py-1.5">
              <SatelliteDish className="h-3.5 w-3.5 flex-shrink-0 text-cyan-300" />
              <span className="hidden shrink-0 sm:inline">Connected to</span>
              <span className="min-w-0 truncate font-mono text-[10px] md:text-[11px]">
                {gatewayUrl}
              </span>
            </motion.div>
          </div>
        </motion.header>

        <div className="min-w-0 space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Current active command
          </h2>
          <ActiveCommandBar latest={latest} />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          <div className="min-w-0 space-y-4 md:col-span-2">
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
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
              <div className="mt-4">
                <QuickActions onSelect={handleQuickSelect} disabled={loading} />
              </div>
            </motion.div>

            <motion.div
              className="card"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
            >
              <HistoryTable entries={history} />
            </motion.div>

            <motion.div className="md:hidden">
              <ToolsPanel />
            </motion.div>
          </div>

          <div className="min-w-0 space-y-4">
            <motion.div
              className="card"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <StatusCard status={status} latest={latest} statusError={statusError} />
            </motion.div>

            <motion.div className="hidden md:block">
              <ToolsPanel />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
