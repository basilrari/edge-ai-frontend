"use client";

import React from "react";
import type { ApiResponse } from "./types";
import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";

export interface HistoryEntry extends ApiResponse {
  timestamp: string;
}

interface Props {
  entries: HistoryEntry[];
}

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export const HistoryTable: React.FC<Props> = ({ entries }) => {
  return (
    <div className="space-y-3">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">History (last 10 inferences)</h2>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-700/70 bg-slate-950/60">
        <table className="min-w-full text-left text-[11px] md:text-xs">
          <thead className="border-b border-slate-700 bg-slate-900/60 text-slate-400">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">State</th>
              <th className="px-3 py-2">Model</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Tool</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Latency</th>
              <th className="px-3 py-2">LLM</th>
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-4 text-center text-slate-500"
                >
                  No inferences yet.
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => (
                <motion.tr
                  key={entry.timestamp}
                  variants={rowVariants}
                  className={`border-b border-slate-800/80 transition-colors hover:bg-slate-900/80 ${
                    idx % 2 === 0 ? "bg-slate-950/40" : "bg-slate-950/20"
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-400">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2">{entry.state}</td>
                  <td className="px-3 py-2">{entry.model ?? "none"}</td>
                  <td className="px-3 py-2">{entry.category ?? ""}</td>
                  <td className="px-3 py-2">{entry.tool_name ?? ""}</td>
                  <td className="px-3 py-2 max-w-[160px] truncate">
                    {entry.action_taken}
                  </td>
                  <td className="px-3 py-2 font-mono">{entry.latency_ms} ms</td>
                  <td className="px-3 py-2 font-mono">{entry.llm_latency_ms} ms</td>
                </motion.tr>
              ))
            )}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
};
