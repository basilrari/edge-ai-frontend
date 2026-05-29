"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Loader2, Trash2, Upload, XCircle } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import type { MissionLeg, MissionOverviewStats } from "../../types/drone";
import type { DroneMission } from "../types";
import {
  buildMissionLegs,
  computeMissionStats,
  formatEstTime,
} from "../../lib/missionUtils";
import {
  DEFAULT_PLANNER_DRAFT,
  draftToPreviewMission,
  draftToUploadBody,
  type MissionPlannerDraft,
  type PlannerWaypoint,
} from "../../lib/missionPlanner";
import { clearDroneMission, uploadMission } from "../../lib/gateway";

interface Props {
  draft: MissionPlannerDraft;
  onDraftChange: (draft: MissionPlannerDraft) => void;
  onMissionUploaded: () => void;
  onDroneMissionCleared: () => void;
  onDroneMission: DroneMission | null;
  droneMissionLoading: boolean;
  droneMissionError: string | null;
  groundspeedMps: number | null;
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-dash-border bg-dash-bg/60 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-dash-muted">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-dash-text">
        {value}
      </p>
    </div>
  );
}

export function MissionPlannerCard({
  draft,
  onDraftChange,
  onMissionUploaded,
  onDroneMissionCleared,
  onDroneMission,
  droneMissionLoading,
  droneMissionError,
  groundspeedMps,
}: Props): JSX.Element {
  const [uploading, setUploading] = useState(false);
  const [clearingDrone, setClearingDrone] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [clearDroneError, setClearDroneError] = useState<string | null>(null);
  const [clearDroneSuccess, setClearDroneSuccess] = useState<string | null>(
    null
  );
  const [confirmClearDrone, setConfirmClearDrone] = useState(false);

  const previewMission = useMemo(
    () => draftToPreviewMission(draft),
    [draft]
  );

  const draftStats: MissionOverviewStats = useMemo(
    () => computeMissionStats(previewMission, groundspeedMps),
    [previewMission, groundspeedMps]
  );

  const droneLegs: MissionLeg[] = useMemo(
    () => buildMissionLegs(onDroneMission),
    [onDroneMission]
  );

  const updateWaypoint = (id: string, patch: Partial<PlannerWaypoint>) => {
    onDraftChange({
      ...draft,
      waypoints: draft.waypoints.map((w) =>
        w.id === id ? { ...w, ...patch } : w
      ),
    });
  };

  const removeWaypoint = (id: string) => {
    onDraftChange({
      ...draft,
      waypoints: draft.waypoints.filter((w) => w.id !== id),
    });
  };

  const handleClearPlan = () => {
    setUploadError(null);
    setUploadSuccess(null);
    onDraftChange({ ...draft, waypoints: [] });
  };

  const handleClearDroneMissionClick = () => {
    setClearDroneError(null);
    setClearDroneSuccess(null);
    setConfirmClearDrone(true);
  };

  const handleClearDroneMissionConfirm = async () => {
    setClearingDrone(true);
    setClearDroneError(null);
    setClearDroneSuccess(null);
    try {
      await clearDroneMission();
      setClearDroneSuccess("Mission cleared on flight controller");
      onDroneMissionCleared();
    } catch (e) {
      setClearDroneError(
        e instanceof Error ? e.message : "Failed to clear drone mission"
      );
    } finally {
      setClearingDrone(false);
      setConfirmClearDrone(false);
    }
  };

  useEffect(() => {
    if (!confirmClearDrone) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !clearingDrone) {
        setConfirmClearDrone(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmClearDrone, clearingDrone]);

  const handleUpload = async () => {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      if (draft.waypoints.length === 0) {
        throw new Error("Add at least one waypoint on the map");
      }
      const result = await uploadMission(draftToUploadBody(draft));
      setUploadSuccess(
        `Mission uploaded (${result.item_count ?? draft.waypoints.length} items on FC)`
      );
      onMissionUploaded();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardCard
      title="Mission Planner"
      bodyClassName="flex flex-col gap-3 p-3"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatBlock label="Plan WPs" value={String(draft.waypoints.length)} />
        <StatBlock
          label="Plan Distance"
          value={
            draftStats.totalDistanceKm > 0
              ? `${draftStats.totalDistanceKm.toFixed(2)} km`
              : "—"
          }
        />
        <StatBlock label="Est. Time" value={formatEstTime(draftStats.estTimeSec)} />
        <StatBlock
          label="Max Alt"
          value={
            draftStats.maxAltitudeM > 0
              ? `${draftStats.maxAltitudeM.toFixed(0)} m`
              : "—"
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-md border border-dash-border bg-dash-bg/50 p-2 text-xs">
        <label className="flex items-center gap-2 text-dash-text">
          <input
            type="checkbox"
            checked={draft.includeTakeoff}
            readOnly
            disabled
            className="accent-dash-accent opacity-80"
          />
          Takeoff (required)
        </label>
        <label className="flex flex-col gap-1 text-dash-muted">
          <span>Takeoff alt (m)</span>
          <input
            type="number"
            min={2}
            max={120}
            value={draft.takeoffAltM}
            disabled={!draft.includeTakeoff}
            onChange={(e) =>
              onDraftChange({
                ...draft,
                takeoffAltM: Number(e.target.value) || 15,
              })
            }
            className="rounded border border-dash-border bg-dash-bg px-2 py-1 text-dash-text"
          />
        </label>
        <label className="flex items-center gap-2 text-dash-text">
          <input
            type="checkbox"
            checked={draft.includeRtl}
            onChange={(e) =>
              onDraftChange({ ...draft, includeRtl: e.target.checked })
            }
            className="accent-dash-accent"
          />
          Return to home
        </label>
        <label className="flex flex-col gap-1 text-dash-muted">
          <span>Default WP alt (m)</span>
          <input
            type="number"
            min={2}
            max={120}
            value={draft.defaultAltM}
            onChange={(e) =>
              onDraftChange({
                ...draft,
                defaultAltM: Number(e.target.value) || 15,
              })
            }
            className="rounded border border-dash-border bg-dash-bg px-2 py-1 text-dash-text"
          />
        </label>
      </div>

      <div className="max-h-[160px] overflow-y-auto rounded-md border border-dash-border bg-dash-bg/40">
        {draft.waypoints.length === 0 ? (
          <p className="p-4 text-center text-xs text-dash-muted">
            Click the map to add waypoints. Set altitude for each leg below, then
            confirm upload.
          </p>
        ) : (
          <ul className="divide-y divide-dash-border">
            {draft.waypoints.map((wp, idx) => (
              <li
                key={wp.id}
                className="flex items-center gap-2 px-3 py-2 text-xs"
              >
                <span className="w-5 font-mono text-dash-muted">{idx + 1}.</span>
                <span className="min-w-0 flex-1 truncate font-mono text-dash-muted">
                  {wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}
                </span>
                <input
                  type="number"
                  min={2}
                  max={120}
                  value={wp.altM}
                  onChange={(e) =>
                    updateWaypoint(wp.id, {
                      altM: Number(e.target.value) || draft.defaultAltM,
                    })
                  }
                  className="w-16 rounded border border-dash-border bg-dash-bg px-1.5 py-0.5 text-dash-text"
                  aria-label={`Altitude for waypoint ${idx + 1}`}
                />
                <span className="text-dash-muted">m</span>
                <button
                  type="button"
                  onClick={() => removeWaypoint(wp.id)}
                  className="text-dash-muted hover:text-red-400"
                  aria-label={`Remove waypoint ${idx + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-md border border-dash-border bg-dash-bg/60 px-3 py-2 text-xs text-dash-muted transition hover:border-dash-amber/40 hover:text-dash-text disabled:cursor-not-allowed disabled:opacity-40"
          disabled={draft.waypoints.length === 0 || uploading || clearingDrone}
          onClick={handleClearPlan}
        >
          <XCircle className="h-3.5 w-3.5" />
          Clear plan
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-md border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs text-rose-300 transition hover:border-rose-500/50 hover:bg-rose-950/35 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={
            droneLegs.length === 0 ||
            droneMissionLoading ||
            uploading ||
            clearingDrone ||
            confirmClearDrone
          }
          onClick={handleClearDroneMissionClick}
        >
          {clearingDrone ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Clear drone mission
        </button>
      </div>

      {confirmClearDrone && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-black/60"
                aria-label="Dismiss"
                disabled={clearingDrone}
                onClick={() => setConfirmClearDrone(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="clear-drone-title"
                className="relative w-full max-w-sm rounded-lg border border-rose-500/40 bg-dash-bg p-4 shadow-2xl"
              >
                <h3
                  id="clear-drone-title"
                  className="text-sm font-semibold text-dash-text"
                >
                  Clear drone mission?
                </h3>
                <p className="mt-2 text-xs text-dash-muted">
                  This removes the mission from the flight controller. It cannot
                  be undone from the dashboard.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-md border border-dash-border bg-dash-bg/60 px-3 py-2 text-xs text-dash-text transition hover:border-dash-border/80"
                    disabled={clearingDrone}
                    onClick={() => setConfirmClearDrone(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-1 rounded-md border border-rose-500/50 bg-rose-950/40 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-950/60 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={clearingDrone}
                    onClick={handleClearDroneMissionConfirm}
                  >
                    {clearingDrone ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Clearing…
                      </>
                    ) : (
                      "Yes, clear mission"
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      <button
        type="button"
        className="primary send-drone-btn w-full py-3 text-sm"
        disabled={uploading || clearingDrone || draft.waypoints.length === 0}
        onClick={handleUpload}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading to drone…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Confirm &amp; upload mission
          </>
        )}
      </button>

      {uploadError ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
          {uploadError}
        </p>
      ) : null}
      {uploadSuccess ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300">
          {uploadSuccess}
        </p>
      ) : null}

      {clearDroneError ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
          {clearDroneError}
        </p>
      ) : null}
      {clearDroneSuccess ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300">
          {clearDroneSuccess}
        </p>
      ) : null}

      <div className="border-t border-dash-border pt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-dash-muted">
          On drone now
        </p>
        <div className="max-h-[120px] overflow-y-auto rounded-md border border-dash-border bg-dash-bg/30">
          {droneMissionLoading && droneLegs.length === 0 && (
            <p className="p-3 text-center text-xs text-dash-muted">
              Loading mission from FC…
            </p>
          )}
          {droneMissionError && droneLegs.length === 0 && (
            <p className="p-3 text-center text-xs text-dash-amber">
              {droneMissionError}
            </p>
          )}
          {!droneMissionLoading && droneLegs.length === 0 && !droneMissionError && (
            <p className="p-3 text-center text-xs text-dash-muted">
              No mission on the link yet.
            </p>
          )}
          {droneLegs.length > 0 && (
            <ul className="divide-y divide-dash-border/60">
              {droneLegs.map((leg, idx) => (
                <li
                  key={leg.id}
                  className={clsx(
                    "px-3 py-1.5 text-xs",
                    leg.status === "in_progress" && "bg-dash-blue/5"
                  )}
                >
                  <span className="font-mono text-dash-muted">{idx + 1}.</span>{" "}
                  <span
                    className={
                      leg.status === "in_progress"
                        ? "text-dash-blue"
                        : "text-dash-text"
                    }
                  >
                    {leg.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
