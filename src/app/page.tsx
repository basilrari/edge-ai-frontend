"use client";

import React, { useEffect, useMemo, useState } from "react";
import { StatusCard } from "../components/StatusCard";
import { HistoryTable } from "../components/HistoryTable";
import { PromptForm } from "../components/PromptForm";
import { QuickActions } from "../components/QuickActions";
import type { ApiResponse, StatusResponse } from "../components/types";

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

  // Poll /status every 2s
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
    const id = setInterval(fetchStatus, 2000);
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

  const gatewayUrl = useMemo(() => GATEWAY_URL, []);

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Jetson LLM Gateway Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Live telemetry for SAR drone tool calls and LLM routing.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            <div>Gateway URL: {gatewayUrl}</div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div className="card">
              <PromptForm onSend={onSendPrompt} loading={loading} error={error} />
              <div className="mt-4">
                <QuickActions onSend={onSendPrompt} disabled={loading} />
              </div>
            </div>

            <div className="card">
              <HistoryTable entries={history} />
            </div>
          </div>
          <div className="card">
            <StatusCard status={status} latest={latest} />
          </div>
        </section>
      </div>
    </main>
  );
}
