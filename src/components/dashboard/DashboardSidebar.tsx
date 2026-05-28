"use client";

import React from "react";
import clsx from "clsx";
import {
  ChevronLeft,
  LayoutDashboard,
  Map,
  MapPin,
  Plane,
  ScrollText,
  Settings,
  Target,
} from "lucide-react";
import { BRAND_NAME, MOCK_DRONE } from "../../lib/mockData";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
  { id: "mission", label: "Mission", icon: Target, active: false },
  { id: "map", label: "Map", icon: Map, active: false },
  { id: "logs", label: "Flight Logs", icon: ScrollText, active: false },
  { id: "drones", label: "Drones", icon: Plane, active: false },
  { id: "geofences", label: "Geofences", icon: MapPin, active: false },
  { id: "settings", label: "Settings", icon: Settings, active: false },
] as const;

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  droneOnline: boolean;
}

export function DashboardSidebar({
  collapsed,
  onToggleCollapse,
  droneOnline,
}: Props): JSX.Element {
  return (
    <aside
      className={clsx(
        "hidden shrink-0 flex-col border-r border-dash-border bg-dash-bg md:flex",
        collapsed ? "w-[68px]" : "w-[220px]"
      )}
    >
      <div className="flex items-center gap-2 border-b border-dash-border px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-dash-blue to-dash-accent">
          <Plane className="h-4 w-4 text-dash-bg" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <p className="text-sm font-bold tracking-[0.18em] text-dash-text">
            {BRAND_NAME}
          </p>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-3">
        {NAV.map(({ id, label, icon: Icon, active }) => (
          <button
            key={id}
            type="button"
            title={collapsed ? label : undefined}
            className={clsx(
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] transition-colors",
              active
                ? "bg-dash-accent/10 font-medium text-dash-accent"
                : "text-dash-muted hover:bg-dash-panel hover:text-dash-text"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={clsx(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-dash-accent" : "text-dash-muted"
              )}
            />
            {!collapsed && label}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="mx-2 mb-2 rounded-lg border border-dash-border bg-dash-panel p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-dash-text">
              {MOCK_DRONE.name}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-dash-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-dash-accent" />
              {droneOnline ? "Online" : "Offline"}
            </span>
          </div>
          <div className="mb-2 flex h-16 items-center justify-center rounded-md bg-[#0b0e14]">
            <Plane className="h-10 w-10 text-dash-muted/60" strokeWidth={1.2} />
          </div>
          <p className="text-[11px] text-dash-text">{MOCK_DRONE.model}</p>
          <p className="font-mono text-[10px] text-dash-muted">
            Firmware {MOCK_DRONE.firmware}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex items-center gap-2 border-t border-dash-border px-4 py-3 text-[11px] text-dash-muted hover:text-dash-text"
      >
        <ChevronLeft
          className={clsx("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")}
        />
        {!collapsed && "Collapse"}
      </button>
    </aside>
  );
}
