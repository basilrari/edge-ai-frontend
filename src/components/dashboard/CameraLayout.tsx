"use client";

import React from "react";
import { AppShell } from "./AppShell";
import { LiveCameraCard } from "./LiveCameraCard";

export function CameraLayout(): JSX.Element {
  return (
    <AppShell pageTitle="Camera" lockViewport>
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="shrink-0">
          <h1 className="text-base font-semibold text-dash-text">Camera</h1>
          <p className="text-[11px] text-dash-muted">
            Live video from the onboard drone camera via the model server.
          </p>
        </div>
        <div className="min-h-0 flex-1">
          <LiveCameraCard fullHeight />
        </div>
      </div>
    </AppShell>
  );
}
