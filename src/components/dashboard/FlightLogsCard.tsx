"use client";

import React from "react";
import { MoreHorizontal } from "lucide-react";
import clsx from "clsx";
import { DashboardCard } from "./DashboardCard";
import type { MissionLog } from "../../types/drone";

interface Props {
  logs: MissionLog[];
}

function StatusBadge({ status }: { status: MissionLog["status"] }): JSX.Element {
  const styles: Record<MissionLog["status"], string> = {
    Success: "bg-dash-accent/15 text-dash-accent ring-dash-accent/30",
    Partial: "bg-dash-amber/15 text-dash-amber ring-dash-amber/30",
    Failed: "bg-red-500/15 text-red-400 ring-red-500/30",
    "In Progress": "bg-dash-blue/15 text-dash-blue ring-dash-blue/30",
  };
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

export function FlightLogsCard({ logs }: Props): JSX.Element {
  return (
    <DashboardCard
      title="Flight Logs"
      className="h-full"
      headerRight={
        <button type="button" className="text-[11px] text-dash-accent hover:text-[#86efac]">
          View All
        </button>
      }
      bodyClassName="overflow-hidden p-0"
    >
      <div className="max-h-[320px] overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-dash-panel text-[9px] uppercase tracking-wider text-dash-muted">
            <tr className="border-b border-dash-border">
              <th className="px-3 py-2 font-semibold">Mission Name</th>
              <th className="hidden px-2 py-2 font-semibold xl:table-cell">Date</th>
              <th className="px-2 py-2 font-semibold">Duration</th>
              <th className="hidden px-2 py-2 font-semibold lg:table-cell">Distance</th>
              <th className="px-2 py-2 font-semibold">Status</th>
              <th className="w-8 px-1 py-2" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {logs.map((row) => (
              <tr
                key={row.id}
                className="border-b border-dash-border/60 hover:bg-dash-bg/50"
              >
                <td className="max-w-[100px] truncate px-3 py-2 font-medium text-dash-text">
                  {row.missionName}
                </td>
                <td className="hidden whitespace-nowrap px-2 py-2 text-dash-muted xl:table-cell">
                  {row.date}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-dash-muted">
                  {row.duration}
                </td>
                <td className="hidden whitespace-nowrap px-2 py-2 text-dash-muted lg:table-cell">
                  {row.distance ?? "—"}
                </td>
                <td className="px-2 py-2">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-1 py-2">
                  <button
                    type="button"
                    className="rounded p-1 text-dash-muted hover:bg-dash-border hover:text-dash-text"
                    aria-label="Row actions"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
