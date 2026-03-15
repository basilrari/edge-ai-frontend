"use client";

import React, { useMemo } from "react";
import type { ApiResponse } from "./types";
import { motion } from "framer-motion";
import { Plane, Cpu, Check, X } from "lucide-react";

/** Model tools (SAR perception) – map tool_name to short display label */
const MODEL_TOOL_LABELS: Record<string, string> = {
  activate_human_detection_yolo: "Human detection (YOLO)",
  activate_flood_segmentation: "Flood segmentation",
  activate_human_behaviour_analysis: "Behaviour analysis",
  share_with_swarm: "Share with swarm",
  activate_flood_classification: "Flood classification",
};

/** Drone movement tools – map tool_name to short display label */
const DRONE_TOOL_LABELS: Record<string, string> = {
  move_forward: "Move forward",
  hover: "Hover",
  return_to_home: "Return to home",
  land_immediately: "Land immediately",
  circle_search: "Circle search",
};

function isDroneTool(toolName: string | null): boolean {
  if (!toolName) return false;
  return toolName in DRONE_TOOL_LABELS;
}

/** Model slot shows a tool when it's a known model tool or any unknown (assumed model) tool. */
function modelDisplay(toolName: string | null): string {
  if (!toolName) return "Normal sequential flow";
  return MODEL_TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ");
}

function droneDisplay(toolName: string | null): string {
  if (!toolName) return "Autonomous mode";
  return DRONE_TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ");
}

interface Props {
  /** Last response actually sent to server. Drives Drone/Model cards only (updated after Accept). */
  confirmed: ApiResponse | null;
  /** Latest infer response; used for pending proposal UI and Accept/Reject. */
  latest: ApiResponse | null;
  /** Called when user accepts the proposed tool; frontend should call gateway ApplyTool. */
  onAccept?: () => void;
  /** Called when user rejects the proposal. */
  onReject?: () => void;
  /** True while ApplyTool request is in flight. */
  applying?: boolean;
}

/** When category is "none", human-readable reason for no tool */
const NONE_REASON_LABELS: Record<string, string> = {
  ambiguous_request: "Ambiguous request",
  greeting_only: "Greeting only",
  informational_request: "Informational request",
  unsafe_or_invalid: "Unsafe or invalid",
};

function noneReasonDisplay(name: string | null): string {
  if (!name) return "No tool selected";
  return NONE_REASON_LABELS[name] ?? name.replace(/_/g, " ");
}

export const ActiveCommandBar: React.FC<Props> = ({
  confirmed,
  latest,
  onAccept,
  onReject,
  applying = false,
}) => {
  const { droneLabel, modelLabel, droneActive, modelActive, noneReason } = useMemo(() => {
    const cat = confirmed?.category ?? null;
    const tool = confirmed?.tool_name ?? null;

    if (!confirmed || cat === "none") {
      return {
        droneLabel: "Autonomous mode",
        modelLabel: "Normal sequential flow",
        droneActive: false,
        modelActive: false,
        noneReason: noneReasonDisplay(tool),
      };
    }

    const isDrone = isDroneTool(tool);
    const hasModelTool = tool != null && !isDrone;
    return {
      droneLabel: isDrone ? droneDisplay(tool) : "Autonomous mode",
      modelLabel: hasModelTool ? modelDisplay(tool) : "Normal sequential flow",
      droneActive: isDrone,
      modelActive: hasModelTool,
      noneReason: null as string | null,
    };
  }, [confirmed?.category, confirmed?.tool_name]);

  const { showApprove: pending, proposedLabel: proposed } = useMemo(() => {
    const category = latest?.category ?? null;
    const tool = latest?.tool_name ?? null;
    const pending = latest?.pending_approval === true;
    if (!pending || category === "none") return { showApprove: false, proposedLabel: null as string | null };
    const isDrone = isDroneTool(tool);
    const hasModel = tool != null && !isDrone;
    const label = isDrone ? droneDisplay(tool) : hasModel ? modelDisplay(tool) : null;
    return { showApprove: true, proposedLabel: label };
  }, [latest?.category, latest?.tool_name, latest?.pending_approval]);

  const messageLine = !pending && noneReason != null
    ? `No tool selected — ${noneReason}`
    : pending && proposed
      ? `Proposed: ${proposed} — Approve to send to server`
      : null;

  return (
    <motion.section
      className="min-w-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex min-w-0 flex-col gap-3">
        {/* Message line: fixed height so layout doesn't shift when content changes */}
        <div className="min-h-[1.25rem] text-xs leading-5">
          {messageLine != null && (
            <p className={pending ? "text-amber-400/90" : "text-slate-400"}>
              {messageLine}
            </p>
          )}
        </div>

        {/* Drone + Model cards */}
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-cyan-500/25 bg-slate-900/50 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              <Plane className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
              <span>Drone</span>
            </div>
            <p
              className={`min-w-0 truncate text-sm font-medium sm:text-base ${droneActive ? "text-cyan-300" : "text-slate-300"}`}
              title={droneLabel}
            >
              {droneLabel}
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-cyan-500/25 bg-slate-900/50 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              <Cpu className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
              <span>Model</span>
            </div>
            <p
              className={`min-w-0 truncate text-sm font-medium sm:text-base ${modelActive ? "text-emerald-300" : "text-slate-300"}`}
              title={modelLabel}
            >
              {modelLabel}
            </p>
          </div>
        </div>

        {/* Approval actions: single block with consistent padding so it doesn't disrupt layout */}
        {pending && onAccept && onReject && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/20 bg-slate-900/40 px-3 py-2.5">
            <button
              type="button"
              onClick={onAccept}
              disabled={applying}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-emerald-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            >
              <Check className="h-4 w-4 shrink-0" />
              Accept
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={applying}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-500 bg-slate-800/80 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
            >
              <X className="h-4 w-4 shrink-0" />
              Reject
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );
};
