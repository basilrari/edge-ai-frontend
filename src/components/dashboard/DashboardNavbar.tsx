"use client";

import React from "react";
import {
  Battery,
  ChevronLeft,
  Settings,
} from "lucide-react";
import { fmtLinkKind } from "../../lib/format";

interface Props {
  droneOnline: boolean;
  batteryPercent: number | null;
  linkKind?: string | null;
  linkDisplay?: string | null;
}

export function DashboardNavbar({
  droneOnline,
  batteryPercent,
  linkKind,
  linkDisplay,
}: Props): JSX.Element {
  const linkLabel = fmtLinkKind(linkKind);
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-dash-border bg-dash-panel px-5">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm text-dash-muted hover:text-dash-text"
      >
        <ChevronLeft className="h-4 w-4" />
        Mission Control
      </button>

      <div className="flex items-center gap-4 text-xs text-dash-text">
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${droneOnline ? "bg-dash-accent" : "bg-red-500"}`}
            />
            {droneOnline ? "Drone Online" : "Drone Offline"}
          </span>
          {linkLabel ? (
            <span
              className="rounded-full border border-dash-border bg-dash-bg px-2 py-0.5 font-medium text-dash-muted"
              title={linkDisplay ?? undefined}
            >
              {linkLabel}
            </span>
          ) : null}
        </span>
        <span className="flex items-center gap-1 font-medium">
          <Battery className="h-4 w-4 text-dash-accent" />
          {batteryPercent != null ? `${batteryPercent}%` : "—"}
        </span>
        <button
          type="button"
          className="text-dash-muted hover:text-dash-text"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dash-accent/15 text-[11px] font-semibold text-dash-accent ring-1 ring-dash-accent/30">
          OP
        </div>
      </div>
    </header>
  );
}
