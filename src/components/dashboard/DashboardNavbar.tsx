"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, Settings } from "lucide-react";
import { fmtBatteryPowerBadge, fmtLinkKind } from "../../lib/format";

interface Props {
  pageTitle?: string;
  droneOnline: boolean;
  linkKind?: string | null;
  linkDisplay?: string | null;
  batteryVoltageV?: number | null;
  batteryCurrentA?: number | null;
  batteryPowerW?: number | null;
  batteryRemainingPct?: number | null;
}

export function DashboardNavbar({
  pageTitle = "Mission Control",
  droneOnline,
  linkKind,
  linkDisplay,
  batteryVoltageV,
  batteryCurrentA,
  batteryPowerW,
  batteryRemainingPct,
}: Props): JSX.Element {
  const linkLabel = fmtLinkKind(linkKind);
  const powerBadge = fmtBatteryPowerBadge(
    batteryVoltageV,
    batteryCurrentA,
    batteryPowerW,
    batteryRemainingPct
  );
  const [utc, setUtc] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setUtc(
        d.toLocaleTimeString("en-US", {
          timeZone: "UTC",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-dash-border bg-dash-panel px-5">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm text-dash-muted hover:text-dash-text"
      >
        <ChevronLeft className="h-4 w-4" />
        Mission Control
        {pageTitle !== "Mission Control" ? (
          <span className="text-dash-muted"> / {pageTitle}</span>
        ) : null}
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
          <span
            className="rounded-full border border-dash-border bg-dash-bg px-2 py-0.5 font-mono font-medium"
            title="Battery voltage, current, power"
          >
            <span className={powerBadge.live ? "text-dash-accent" : "text-dash-muted"}>
              {powerBadge.label}
            </span>
          </span>
        </span>
        <span className="font-mono text-[11px] font-medium text-dash-muted">
          UTC {utc}
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
