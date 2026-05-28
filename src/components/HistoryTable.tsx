"use client";

import React, { useMemo } from "react";
import type { ApiResponse } from "./types";
import { Clock3 } from "lucide-react";

export interface HistoryEntry extends ApiResponse {
  timestamp: string;
}

interface Props {
  entries: HistoryEntry[];
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
    /* raw */
  }
  return raw.trim();
}

export const HistoryTable: React.FC<Props> = ({ entries }) => {
  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-slate-400" />
        <h2 className="text-sm font-semibold">History</h2>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-500">No prompts yet.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <HistoryRow key={entry.timestamp} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
};

function HistoryRow({ entry }: { entry: HistoryEntry }): JSX.Element {
  const output = useMemo(
    () => extractLlmOutput(entry.llm_response),
    [entry.llm_response]
  );

  return (
    <li className="rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-[11px]">
      <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400">
        <span className="font-mono">
          {new Date(entry.timestamp).toLocaleString()}
        </span>
        <span className="font-mono text-cyan-300/90">{entry.latency_ms} ms</span>
      </div>
      <p className="mt-1.5 whitespace-pre-wrap break-words text-slate-200">{output || "—"}</p>
    </li>
  );
}
