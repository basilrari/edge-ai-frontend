"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardSidebar } from "./DashboardSidebar";
import { TimeDisplayProvider } from "./TimeDisplayProvider";
import {
  GatewayConfigProvider,
  useGatewayConfig,
} from "../../hooks/GatewayConfigProvider";
import { TelemetryProvider, useTelemetry } from "../../hooks/useTelemetry";
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
  return (
    <GatewayConfigProvider>
      <AppShellGatewayGate pageTitle={pageTitle} lockViewport={lockViewport}>
        {children}
      </AppShellGatewayGate>
    </GatewayConfigProvider>
  );
}

function AppShellGatewayGate({
  children,
  pageTitle,
  lockViewport,
}: Props): JSX.Element {
  const { gatewayUrl, gatewayError, ready } = useGatewayConfig();

  if (!ready) {
    return (
      <div className="dashboard-app flex h-screen items-center justify-center bg-dash-bg text-dash-muted">
        Loading Mission Control…
      </div>
    );
  }

  if (gatewayError || !gatewayUrl) {
    return (
      <div className="dashboard-app flex h-screen items-center justify-center bg-dash-bg p-6 text-center">
        <div className="max-w-lg rounded-lg border border-red-500/40 bg-red-950/30 p-6 text-red-200">
          <p className="text-lg font-semibold">Gateway URL not configured</p>
          <p className="mt-2 text-sm text-red-100/90">
            {gatewayError ??
              "Set NEXT_PUBLIC_GATEWAY_URL in .env.local or Vercel project env."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TelemetryProvider gatewayUrl={gatewayUrl}>
      <AppShellFrame pageTitle={pageTitle} lockViewport={lockViewport}>
        {children}
      </AppShellFrame>
    </TelemetryProvider>
  );
}

function AppShellFrame({
  children,
  pageTitle,
  lockViewport,
}: Props): JSX.Element {
  const pathname = usePathname();
  const { live, connected, telemetry } = useTelemetry();
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
