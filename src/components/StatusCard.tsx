"use client";

import React, { useMemo } from "react";
import type { ApiResponse, StatusResponse } from "./types";
import { Clock } from "lucide-react";

interface Props {
  status: StatusResponse | null;
  latest: ApiResponse | null;
  statusError?: string | null;
}

function extractLlmOutput(raw: string): string {
  if (!raw?.trim()) return "";
  try {
    const parsed = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: string }; text?: string }>;
    };
    const content = parsed.choices?.[0]?.message?.content ?? parsed.choices?.[0]?.text;
    if (typeof content === "string" && content.trim()) return content.trim();
  } catch {
    /* use raw */
  }
  return raw.trim();
}

export const StatusCard: React.FC<Props> = ({
  status,
  latest,
  statusError = null,
}) => {
  const latencyMs = latest?.latency_ms ?? status?.latency_ms ?? 0;
  const llmLatencyMs = latest?.llm_latency_ms ?? status?.llm_latency_ms ?? 0;

  const output = useMemo(
    () => extractLlmOutput(latest?.llm_response ?? ""),
    [latest?.llm_response]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-cyan-400" />
        <h2 className="text-sm font-semibold">Last inference</h2>
      </div>

      {statusError && (
        <p className="text-xs text-amber-200">Gateway unreachable ({statusError})</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-slate-700/60 bg-slate-950/70 px-3 py-2">
          <div className="text-[10px] text-slate-500">Total time</div>
          <div className="font-mono text-slate-100">{latencyMs} ms</div>
        </div>
        <div className="rounded-lg border border-slate-700/60 bg-slate-950/70 px-3 py-2">
          <div className="text-[10px] text-slate-500">LLM time</div>
          <div className="font-mono text-slate-100">{llmLatencyMs} ms</div>
        </div>
      </div>

      {latest?.drone_error && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
          Drone: {latest.drone_error}
        </p>
      )}

      {latest ? (
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">LLM output</div>
          <pre className="max-h-48 overflow-auto rounded-xl border border-slate-700/70 bg-slate-950/90 p-2 font-mono text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap break-words">
            {output || "(empty)"}
          </pre>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Send a prompt to see timing and output.</p>
      )}
    </div>
  );
};
