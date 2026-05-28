"use client";

import React from "react";
import Link from "next/link";
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
import { BRAND_NAME, SIDEBAR_DRONE } from "../../lib/constants";

const NAV: {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  disabled?: boolean;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "mission", label: "Mission", icon: Target, href: "/mission" },
  { id: "map", label: "Map", icon: Map, href: "#", disabled: true },
  { id: "logs", label: "Flight Logs", icon: ScrollText, href: "#", disabled: true },
  { id: "drones", label: "Drones", icon: Plane, href: "#", disabled: true },
  { id: "geofences", label: "Geofences", icon: MapPin, href: "#", disabled: true },
  { id: "settings", label: "Settings", icon: Settings, href: "#", disabled: true },
];

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  droneOnline: boolean;
  linkDisplay?: string;
  activePath: string;
}

function isActive(href: string, activePath: string): boolean {
  if (href === "/") return activePath === "/";
  return activePath.startsWith(href);
}

export function DashboardSidebar({
  collapsed,
  onToggleCollapse,
  droneOnline,
  linkDisplay,
  activePath,
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
        {NAV.map(({ id, label, icon: Icon, href, disabled }) => {
          const active = !disabled && isActive(href, activePath);
          const className = clsx(
            "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] transition-colors",
            active
              ? "bg-dash-accent/10 font-medium text-dash-accent"
              : disabled
                ? "cursor-not-allowed text-dash-muted/40"
                : "text-dash-muted hover:bg-dash-panel hover:text-dash-text"
          );

          if (disabled) {
            return (
              <span key={id} className={className} title={collapsed ? label : undefined}>
                <Icon className="h-[18px] w-[18px] shrink-0 text-dash-muted/40" />
                {!collapsed && label}
              </span>
            );
          }

          return (
            <Link
              key={id}
              href={href}
              title={collapsed ? label : undefined}
              className={className}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={clsx(
                  "h-[18px] w-[18px] shrink-0",
                  active ? "text-dash-accent" : "text-dash-muted"
                )}
              />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mx-2 mb-2 rounded-lg border border-dash-border bg-dash-panel p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-dash-text">
              {SIDEBAR_DRONE.name}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-dash-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-dash-accent" />
              {droneOnline ? "Online" : "Offline"}
            </span>
          </div>
          <div className="mb-2 flex h-16 items-center justify-center rounded-md bg-dash-bg">
            <Plane className="h-10 w-10 text-dash-muted/60" strokeWidth={1.2} />
          </div>
          <p className="text-[11px] text-dash-text">{SIDEBAR_DRONE.model}</p>
          <p className="truncate font-mono text-[10px] text-dash-muted">
            {linkDisplay ?? "No MAVLink link"}
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
