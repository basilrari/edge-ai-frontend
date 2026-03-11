"use client";

import React from "react";
import type { ApiResponse, StatusResponse } from "./types";

interface Props {
  status: StatusResponse | null;
  latest: ApiResponse | null;
}

export const StatusCard: React.FC<Props> = ({ status, latest }) => {
  const state = latest?.state ?? status?.state ?? "UNKNOWN";
  const model = latest?.model ?? status?.model ?? null;
  const overrideActive = latest?.override_active ?? status?.override_active ?? false;
  const latency = latest?.latency_ms ?? status?.latency_ms ?? 0;
  const llmLatency = latest?.llm_latency_ms ?? status?.llm_latency_ms ?? 0;
  const memoryMb = status?.memory_estimate_mb ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gateway Status</h2>
        <span className="badge">{state}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-slate-400">Model</div>
          <div className="font-mono text-sm">{model ?? "none"}</div>
        </div>
        <div>
          <div className="text-slate-400">Override</div>
          <div className="font-mono text-sm">
            {overrideActive ? "ACTIVE" : "inactive"}
          </div>
        </div>
        <div>
          <div className="text-slate-400">Latency (gateway)</div>
          <div className="font-mono text-sm">{latency} ms</div>
        </div>
        <div>
          <div className="text-slate-400">Latency (LLM)</div>
          <div className="font-mono text-sm">{llmLatency} ms</div>
        </div>
        {memoryMb !== null && (
          <div>
            <div className="text-slate-400">Memory</div>
            <div className="font-mono text-sm">{memoryMb.toFixed(2)} MB</div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-300">Last tool decision</h3>
        {latest ? (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge">category: {latest.category ?? "n/a"}</span>
              <span className="badge">tool: {latest.tool_name ?? "n/a"}</span>
              <span className="badge">action: {latest.action_taken}</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">Raw LLM response:</div>
            <code className="llm-response">{latest.llm_response || "(empty)"}</code>
          </>
        ) : (
          <p className="text-xs text-slate-500">No inferences yet.</p>
        )}
      </div>
    </div>
  );
};
