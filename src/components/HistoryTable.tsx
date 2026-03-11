"use client";

import React from "react";
import type { ApiResponse } from "./types";

export interface HistoryEntry extends ApiResponse {
  timestamp: string;
}

interface Props {
  entries: HistoryEntry[];
}

export const HistoryTable: React.FC<Props> = ({ entries }) => {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">History (last 10 inferences)</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-cardBorder text-slate-400">
            <tr>
              <th className="px-2 py-1">Time</th>
              <th className="px-2 py-1">State</th>
              <th className="px-2 py-1">Model</th>
              <th className="px-2 py-1">Category</th>
              <th className="px-2 py-1">Tool</th>
              <th className="px-2 py-1">Action</th>
              <th className="px-2 py-1">Latency</th>
              <th className="px-2 py-1">LLM</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-2 py-3 text-center text-slate-500"
                >
                  No inferences yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.timestamp} className="border-b border-cardBorder">
                  <td className="px-2 py-1 font-mono text-[11px] text-slate-400">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-2 py-1">{entry.state}</td>
                  <td className="px-2 py-1">{entry.model ?? "none"}</td>
                  <td className="px-2 py-1">{entry.category ?? ""}</td>
                  <td className="px-2 py-1">{entry.tool_name ?? ""}</td>
                  <td className="px-2 py-1 truncate max-w-[140px]">
                    {entry.action_taken}
                  </td>
                  <td className="px-2 py-1 font-mono">{entry.latency_ms} ms</td>
                  <td className="px-2 py-1 font-mono">{entry.llm_latency_ms} ms</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
