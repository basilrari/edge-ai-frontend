"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardSidebar } from "./DashboardSidebar";
import { BottomStatusBar } from "./BottomStatusBar";
import { useTelemetry } from "../../hooks/useTelemetry";
import { GATEWAY_URL } from "../../lib/gateway";
import { fmtLinkKind } from "../../lib/format";

interface Props {
  children: React.ReactNode;
  pageTitle?: string;
}

export function AppShell({
  children,
  pageTitle = "Mission Control",
}: Props): JSX.Element {
  const pathname = usePathname();
  const gatewayUrl = GATEWAY_URL;
  const { live, connected } = useTelemetry(gatewayUrl);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-dash-bg text-dash-text">
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
          />

          <main className="min-h-0 flex-1 overflow-y-auto p-3">{children}</main>

          <BottomStatusBar />
        </div>
      </div>
    </div>
  );
}
