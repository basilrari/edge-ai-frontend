"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";
import { DashboardCard } from "./DashboardCard";
import type { FlightLogEntry } from "../types";

interface Props {
  entries: FlightLogEntry[];
  loading: boolean;
  error: string | null;
  fillHeight?: boolean;
}

function severityDotClass(level: string): string {
  switch (level) {
    case "error":
      return "bg-red-500 ring-red-500/30";
    case "warn":
      return "bg-yellow-400 ring-yellow-400/30";
    default:
      return "bg-emerald-500 ring-emerald-500/30";
  }
}

function SeverityDot({ level }: { level: string }): JSX.Element {
  return (
    <span
      className={clsx(
        "mt-1.5 h-2 w-2 shrink-0 rounded-full ring-2",
        severityDotClass(level)
      )}
      aria-label={level}
      title={level}
    />
  );
}

export function FlightLogsCard({
  entries,
  loading,
  error,
  fillHeight = false,
}: Props): JSX.Element {
  const rows = [...entries].reverse();

  return (
    <DashboardCard
      title="Flight Logs"
      className={fillHeight ? "h-full min-h-0" : undefined}
      bodyClassName="overflow-hidden p-0"
      headerRight={
        <Link
          href="/logs"
          className="text-[10px] font-medium text-dash-muted hover:text-dash-accent"
        >
          View all
        </Link>
      }
    >
      <div
        className={clsx(
          "overflow-x-hidden overflow-y-auto dash-scroll",
          fillHeight ? "h-full max-h-none" : "max-h-[280px]"
        )}
      >
        {error && (
          <p className="border-b border-dash-border px-3 py-2 text-xs text-dash-amber">
            {error}
          </p>
        )}
        {loading && rows.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-dash-muted">
            Loading drone logs…
          </p>
        )}
        {!loading && rows.length === 0 && !error && (
          <p className="px-3 py-4 text-center text-xs text-dash-muted">
            No events yet. Logs appear when drone-http connects and runs commands.
          </p>
        )}
        <ul className="allow-wrap divide-y divide-dash-border/60 font-mono text-[11px]">
          {rows.map((e, i) => (
            <li
              key={`${e.ts_ms}-${i}`}
              className="allow-wrap flex items-start gap-2 px-3 py-2 hover:bg-dash-bg/40"
            >
              <SeverityDot level={e.level} />
              <span className="allow-wrap min-w-0 flex-1 break-words text-dash-text">
                {e.message}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </DashboardCard>
  );
}
