"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardSidebar } from "./DashboardSidebar";
import { TimeDisplayProvider } from "./TimeDisplayProvider";
import { useTelemetry } from "../../hooks/useTelemetry";
import { GATEWAY_URL } from "../../lib/gateway";
import { fmtLinkKind } from "../../lib/format";

interface Props {
  children: React.ReactNode;
  pageTitle?: string;
  /** When true, main content fills viewport height with no page scroll. */
  lockViewport?: boolean;
}

export function AppShell({
  children,
  pageTitle = "Mission Control",
  lockViewport = false,
}: Props): JSX.Element {
  const pathname = usePathname();
  const gatewayUrl = GATEWAY_URL;
  const { live, connected, telemetry } = useTelemetry(gatewayUrl);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <TimeDisplayProvider>
      <div className="dashboard-app flex h-screen flex-col overflow-hidden bg-dash-bg text-dash-text">
        <div className="flex min-h-0 flex-1">
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          droneOnline={connected}
          linkDisplay={fmtLinkKind(live?.link?.kind) ?? undefined}
          activePath={pathname}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardNavbar
            pageTitle={pageTitle}
            droneOnline={connected}
            linkKind={live?.link?.kind}
            linkDisplay={live?.link?.display}
            batteryVoltageV={telemetry.batteryVoltageV}
            batteryCurrentA={telemetry.batteryCurrentA}
            batteryPowerW={telemetry.batteryPowerW}
            batteryRemainingPct={telemetry.batteryRemainingPct}
          />

          <main
            className={clsx(
              "min-h-0 flex-1 p-3",
              lockViewport
                ? "flex flex-col overflow-hidden"
                : "dash-scroll overflow-y-auto"
            )}
          >
            {children}
          </main>
        </div>
      </div>
      </div>
    </TimeDisplayProvider>
  );
}
