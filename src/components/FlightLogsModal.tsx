"use client";

import React, { useEffect, useState } from "react";
import type { FlightLogEntry } from "./types";
import { ScrollText, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  gatewayUrl: string;
}

function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `fe-${Date.now()}`;
}

export function FlightLogsModal({ open, onClose, gatewayUrl }: Props): JSX.Element | null {
  const [entries, setEntries] = useState<FlightLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`${gatewayUrl}/drone/logs`, {
          headers: { "x-request-id": newRequestId() },
        });
        if (!res.ok) throw new Error(`logs ${res.status}`);
        const data = (await res.json()) as { entries?: FlightLogEntry[] };
        if (active) {
          setEntries(data.entries ?? []);
          setError(null);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "failed to load logs");
        }
      }
    };

    load();
    const id = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [open, gatewayUrl]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Flight logs"
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-600 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold">Flight logs</h2>
          </div>
          <button type="button" className="outline p-1.5" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed">
          {error && (
            <p className="mb-2 text-amber-300">Could not load logs: {error}</p>
          )}
          {entries.length === 0 && !error && (
            <p className="text-slate-500">No log entries yet.</p>
          )}
          <ul className="space-y-1">
            {[...entries].reverse().map((e, i) => (
              <li key={`${e.ts_ms}-${i}`} className="break-all text-slate-300">
                <span className="text-slate-500">
                  {new Date(e.ts_ms).toLocaleTimeString()}{" "}
                </span>
                <span
                  className={
                    e.level === "warn"
                      ? "text-amber-400"
                      : e.level === "error"
                        ? "text-rose-400"
                        : "text-cyan-400/90"
                  }
                >
                  [{e.level}]
                </span>{" "}
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
