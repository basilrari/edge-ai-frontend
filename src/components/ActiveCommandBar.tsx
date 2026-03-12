"use client";

import React, { useMemo } from "react";
import type { ApiResponse } from "./types";
import { motion } from "framer-motion";
import { Plane, Cpu } from "lucide-react";

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
  latest: ApiResponse | null;
}

/** When category is "none", human-readable reason for no tool (e.g. ambiguous_request) */
const NONE_REASON_LABELS: Record<string, string> = {
  ambiguous_request: "Ambiguous request",
};

function noneReasonDisplay(name: string | null): string {
  if (!name) return "No tool selected";
  return NONE_REASON_LABELS[name] ?? name.replace(/_/g, " ");
}

export const ActiveCommandBar: React.FC<Props> = ({ latest }) => {
  const { droneLabel, modelLabel, droneActive, modelActive, noneReason } = useMemo(() => {
    const category = latest?.category ?? null;
    const tool = latest?.tool_name ?? null;

    if (category === "none") {
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
  }, [latest?.category, latest?.tool_name]);

  return (
    <motion.section
      className="min-w-0 space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {noneReason != null && (
        <p className="text-xs text-slate-400">
          No tool selected — {noneReason}
        </p>
      )}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-cyan-500/25 bg-slate-900/50 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          <Plane className="h-3.5 w-3.5 text-cyan-400" />
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
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
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
    </motion.section>
  );
};
