"use client";

import React, { useMemo } from "react";
import type { ApiResponse } from "./types";
import { motion } from "framer-motion";
import { Plane, Cpu } from "lucide-react";

const MODEL_TOOL_LABELS: Record<string, string> = {
  human_detect: "Human detect",
  flood_seg: "Flood segmentation",
  flood_class: "Flood classification",
};

const DRONE_TOOL_LABELS: Record<string, string> = {
  arm: "Arm",
  disarm: "Disarm",
  force_arm: "Force arm",
  set_mode_auto: "Mode AUTO",
  set_mode_guided: "Mode GUIDED",
  takeoff: "Takeoff",
  start_mission: "Start mission (AUTO + MISSION_START)",
  mission_set_current: "Mission set current",
  goto_location: "Goto location",
  move_forward: "Move forward",
  hover: "Hover",
  return_to_home: "Return to home",
  land_immediately: "Land immediately",
  circle_search: "Circle search",
  retry_streams: "Retry streams / mission list",
  mission_interrupt: "Mission interrupt (hold)",
  mission_resume: "Mission resume",
  waypoint_inject: "Waypoint inject (guided)",
};

function isDroneTool(toolName: string | null): boolean {
  if (!toolName) return false;
  return toolName in DRONE_TOOL_LABELS;
}

function modelDisplay(toolName: string | null): string {
  if (!toolName) return "Normal sequential flow";
  return MODEL_TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ");
}

function droneDisplay(toolName: string | null): string {
  if (!toolName) return "Autonomous mode";
  return DRONE_TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ");
}

const NONE_REASON_LABELS: Record<string, string> = {
  ambiguous_request: "Ambiguous request",
  informational_request: "Informational request",
  unsafe_or_invalid: "Unsafe or invalid",
};

function noneReasonDisplay(name: string | null): string {
  if (!name) return "No tool selected";
  return NONE_REASON_LABELS[name] ?? name.replace(/_/g, " ");
}

interface Props {
  latest: ApiResponse | null;
}

export const ActiveCommandBar: React.FC<Props> = ({ latest }) => {
  const { droneLabel, modelLabel, droneActive, modelActive, messageLine } = useMemo(() => {
    const cat = latest?.category ?? null;
    const tool = latest?.tool_name ?? null;
    const tools = latest?.tools;

    if (!latest || cat === "none") {
      return {
        droneLabel: "Autonomous mode",
        modelLabel: "Normal sequential flow",
        droneActive: false,
        modelActive: false,
        messageLine: `No tool selected — ${noneReasonDisplay(tool)}`,
      };
    }

    if (tools != null && tools.length > 1) {
      const seq = tools
        .map((t, i) => {
          const label =
            t.category === "drone"
              ? droneDisplay(t.name)
              : t.category === "model"
                ? modelDisplay(t.name)
                : t.name;
          return `${i + 1}. ${label}`;
        })
        .join(" → ");
      const last = tools[tools.length - 1];
      const isDrone = isDroneTool(last.name);
      return {
        droneLabel: isDrone ? droneDisplay(last.name) : "Autonomous mode",
        modelLabel: !isDrone ? modelDisplay(last.name) : "Normal sequential flow",
        droneActive: isDrone,
        modelActive: !isDrone,
        messageLine: `Applied sequence: ${seq}`,
      };
    }

    const isDrone = isDroneTool(tool);
    const hasModelTool = tool != null && !isDrone;
    return {
      droneLabel: isDrone ? droneDisplay(tool) : "Autonomous mode",
      modelLabel: hasModelTool ? modelDisplay(tool) : "Normal sequential flow",
      droneActive: isDrone,
      modelActive: hasModelTool,
      messageLine: latest.action_taken
        ? `Last action: ${latest.action_taken}`
        : null,
    };
  }, [latest]);

  return (
    <motion.section
      className="min-w-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div className="flex min-w-0 flex-col gap-3">
        <div className="min-h-[1.25rem] text-xs leading-5">
          {messageLine != null && (
            <p className="text-slate-400 break-words">{messageLine}</p>
          )}
        </div>

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
      </motion.div>
    </motion.section>
  );
};
