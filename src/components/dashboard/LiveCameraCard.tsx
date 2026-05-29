"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Video, VideoOff } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { cameraStreamUrl } from "../../lib/camera";

interface Props {
  fullHeight?: boolean;
}

export function LiveCameraCard({ fullHeight = false }: Props): JSX.Element {
  const [streamError, setStreamError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const streamUrl = `${cameraStreamUrl()}?v=${retryKey}`;

  return (
    <DashboardCard
      title="Live Camera"
      className={fullHeight ? "h-full min-h-0" : undefined}
      bodyClassName={clsx(
        "relative overflow-hidden bg-[#0b0e14] p-0",
        fullHeight ? "min-h-0 flex-1" : undefined
      )}
      headerRight={
        <span className="flex items-center gap-1.5 text-[10px] text-dash-muted">
          <span
            className={clsx(
              "h-1.5 w-1.5 rounded-full",
              streamError ? "bg-dash-amber" : "bg-dash-accent animate-pulse"
            )}
          />
          {streamError ? "Offline" : "Live"}
        </span>
      }
    >
      <div
        className={clsx(
          "relative flex items-center justify-center",
          fullHeight ? "h-full min-h-[320px]" : "h-[360px]"
        )}
      >
        {!streamError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={streamUrl}
            alt="Drone camera feed"
            className="h-full w-full object-contain"
            onError={() => setStreamError(true)}
            onLoad={() => setStreamError(false)}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 text-center text-dash-muted">
            <VideoOff className="h-10 w-10 text-dash-muted/60" />
            <p className="text-sm">Camera stream unavailable</p>
            <p className="text-[11px]">
              Start the model server on the Jetson and ensure the gateway can reach{" "}
              <span className="font-mono text-dash-text">/video/stream</span>.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-dash-border px-3 py-1.5 text-xs text-dash-text hover:bg-dash-panel"
              onClick={() => {
                setStreamError(false);
                setRetryKey((k) => k + 1);
              }}
            >
              <Video className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
