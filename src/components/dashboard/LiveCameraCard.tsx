"use client";

import React from "react";
import clsx from "clsx";
import { Video, VideoOff } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { useCameraWebRTC } from "../../hooks/useCameraWebRTC";

interface Props {
  fullHeight?: boolean;
}

export function LiveCameraCard({ fullHeight = false }: Props): JSX.Element {
  const { videoRef, state, error, retry } = useCameraWebRTC(true);
  const offline = state === "error";
  const connecting = state === "connecting" || state === "idle";
  const reconnecting = state === "reconnecting";

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
              offline
                ? "bg-dash-amber"
                : reconnecting
                  ? "bg-dash-amber animate-pulse"
                : connecting
                  ? "bg-dash-muted animate-pulse"
                  : "bg-dash-accent animate-pulse"
            )}
          />
          {offline ? "Offline" : reconnecting ? "Reconnecting…" : connecting ? "Connecting…" : "Live"}
        </span>
      }
    >
      <div
        className={clsx(
          "relative flex items-center justify-center",
          fullHeight ? "h-full min-h-[320px]" : "h-[360px]"
        )}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={clsx(
            "h-full w-full object-contain",
            state === "live" || reconnecting ? "opacity-100" : "opacity-0"
          )}
        />
        {offline ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-dash-muted">
            <VideoOff className="h-10 w-10 text-dash-muted/60" />
            <p className="text-sm">Camera stream unavailable</p>
            <p className="text-[11px]">
              Start <span className="font-mono text-dash-text">Drone_LLM</span> on the
              Jetson (
              <span className="font-mono text-dash-text">./run.sh</span>
              ) and ensure the gateway can reach WebRTC signaling at{" "}
              <span className="font-mono text-dash-text">/camera/webrtc/offer</span>.
            </p>
            {error ? (
              <p className="max-w-md text-[10px] font-mono text-dash-amber">{error}</p>
            ) : null}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-dash-border px-3 py-1.5 text-xs text-dash-text hover:bg-dash-panel"
              onClick={retry}
            >
              <Video className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : reconnecting ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-black/50 px-3 py-2 text-center text-[11px] text-dash-amber">
            {error ?? "Reconnecting WebRTC…"}
          </div>
        ) : connecting ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-dash-muted">
            <Video className="h-8 w-8 animate-pulse opacity-60" />
            <p className="text-xs">Connecting WebRTC…</p>
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
}
