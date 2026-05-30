"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import clsx from "clsx";
import { DashboardCard } from "./DashboardCard";
import type { LlmLogEntry } from "../types";

function prettyJson(raw: string | null | undefined): string {
  if (!raw) return "—";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

interface Props {
  entries: LlmLogEntry[];
  loading: boolean;
  error: string | null;
  fillHeight?: boolean;
}

export function LlmOutputCard({
  entries,
  loading,
  error,
  fillHeight = false,
}: Props): JSX.Element {
  const latest = useMemo(() => {
    if (entries.length === 0) return null;
    return [...entries].sort((a, b) => b.ts_ms - a.ts_ms)[0];
  }, [entries]);

  const displayJson = useMemo(
    () => prettyJson(latest?.llm_tool_json),
    [latest?.llm_tool_json]
  );

  return (
    <DashboardCard
      title="LLM Output"
      className={fillHeight ? "h-full min-h-0" : undefined}
      bodyClassName="flex min-h-0 flex-col overflow-hidden p-0"
      headerRight={
        <Link
          href="/logs"
          className="text-[10px] font-medium text-dash-muted hover:text-dash-purple"
        >
          View all
        </Link>
      }
    >
      <div
        className={clsx(
          "flex min-h-0 min-w-0 flex-col overflow-hidden",
          fillHeight ? "h-full" : "max-h-[280px]"
        )}
      >
        {error ? (
          <p className="shrink-0 border-b border-dash-border px-3 py-2 text-xs text-dash-amber">
            {error}
          </p>
        ) : null}
        {loading && !latest ? (
          <p className="px-3 py-4 text-center text-xs text-dash-muted">
            Waiting for LLM output…
          </p>
        ) : null}
        {!loading && !latest && !error ? (
          <p className="px-3 py-4 text-center text-xs text-dash-muted">
            No LLM JSON yet. Send a mission prompt to see tool output here.
          </p>
        ) : null}
        {latest ? (
          <pre className="allow-wrap dash-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#0b0e14] p-3 font-mono text-[11px] leading-relaxed text-dash-text">
            {displayJson}
          </pre>
        ) : null}
      </div>
    </DashboardCard>
  );
}
