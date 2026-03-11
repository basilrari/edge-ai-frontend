"use client";

import React, { useEffect, useMemo, useState } from "react";
import { StatusCard } from "../components/StatusCard";
import { HistoryTable } from "../components/HistoryTable";
import { PromptForm } from "../components/PromptForm";
import { QuickActions } from "../components/QuickActions";
import type { ApiResponse, StatusResponse } from "../components/types";
import { motion } from "framer-motion";
import { Activity, SatelliteDish } from "lucide-react";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000";

interface HistoryEntry extends ApiResponse {
  timestamp: string;
}

export default function Page(): JSX.Element {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [latest, setLatest] = useState<ApiResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState("");

  // Poll /status every 10s
  useEffect(() => {
    let active = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/status`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as StatusResponse;
        if (active) {
          setStatus(data);
        }
      } catch (e) {
        if (active) {
          console.error(e);
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
        headers: { "Content-Type": "application/json" },
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

  const handleQuickSelect = async (prompt: string) => {
    // Show in input first for better UX, then send
    setPromptValue(prompt);
    await onSendPrompt(prompt);
  };

  const gatewayUrl = useMemo(() => GATEWAY_URL, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground px-3 py-4 md:px-6 md:py-6">
      {/* subtle vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.16),_transparent_55%)] opacity-70" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-5">
        {/* Top navbar */}
        <motion.header
          className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/40">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                Jetson SAR Gateway
              </h1>
              <p className="text-xs text-slate-400 md:text-sm">
                Mission control for search-and-rescue drone intelligence.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] md:text-xs text-slate-400">
            <div className="flex items-center gap-2 rounded-full border border-cyan-500/40 bg-slate-900/70 px-3 py-1">
              <SatelliteDish className="h-3.5 w-3.5 text-cyan-300" />
              <span className="hidden sm:inline">Connected to</span>
              <span className="truncate font-mono text-[10px] md:text-[11px]">
                {gatewayUrl}
              </span>
            </div>
          </div>
        </motion.header>

        {/* Main content */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
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
          </div>

          <motion.div
            className="card"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <StatusCard status={status} latest={latest} />
          </motion.div>
        </div>
      </div>
    </main>
  );
}
