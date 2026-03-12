"use client";

import React from "react";
import { BadgeCheck, ScanEye, Brain, Share2, Waves, Info, Waypoints } from "lucide-react";

export const ToolsPanel: React.FC = () => {
  return (
    <div className="card min-w-0 space-y-3 text-xs md:text-sm">
      <div className="flex min-w-0 items-center justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
            <Info className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">
              Available tools
            </h2>
            <p className="text-[11px] text-slate-400">
              Model tools are fully wired. Drone commands are visible but not yet integrated.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-emerald-300">
          <BadgeCheck className="h-3.5 w-3.5" />
          <span>Model tools (execute SAR perception on camera feed)</span>
        </div>
        <ul className="grid gap-2 text-[11px] md:text-xs md:grid-cols-2">
          <li className="flex items-start gap-2">
            <ScanEye className="mt-0.5 h-3.5 w-3.5 text-cyan-300" />
            <div>
              <div className="font-semibold text-slate-100">activate_human_detection_yolo</div>
              <div className="text-slate-400">
                Detect and locate humans in the current camera view.
              </div>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Waves className="mt-0.5 h-3.5 w-3.5 text-cyan-300" />
            <div>
              <div className="font-semibold text-slate-100">activate_flood_segmentation</div>
              <div className="text-slate-400">
                Segment and highlight flooded regions in the scene.
              </div>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Brain className="mt-0.5 h-3.5 w-3.5 text-cyan-300" />
            <div>
              <div className="font-semibold text-slate-100">activate_human_behaviour_analysis</div>
              <div className="text-slate-400">
                Analyze human behaviour to flag distress or suspicious activity.
              </div>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Share2 className="mt-0.5 h-3.5 w-3.5 text-cyan-300" />
            <div>
              <div className="font-semibold text-slate-100">share_with_swarm</div>
              <div className="text-slate-400">
                Share current detection results with the drone swarm.
              </div>
            </div>
          </li>
          <li className="flex items-start gap-2 md:col-span-2">
            <Waves className="mt-0.5 h-3.5 w-3.5 text-cyan-300" />
            <div>
              <div className="font-semibold text-slate-100">activate_flood_classification</div>
              <div className="text-slate-400">
                Classify type and severity of flooding in the observed area.
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div className="space-y-2 pt-1 border-t border-slate-800/70">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Waypoints className="h-3.5 w-3.5 text-slate-500" />
          <span>Drone movement tools (not yet wired, coming soon):</span>
        </div>
        <ul className="grid gap-1 text-[11px] md:text-xs md:grid-cols-2 text-slate-400">
          <li>move_forward &mdash; Fly forward a short distance.</li>
          <li>hover &mdash; Hold current position and altitude.</li>
          <li>return_to_home &mdash; Return safely to launch point.</li>
          <li>land_immediately &mdash; Land immediately at current location.</li>
          <li className="md:col-span-2">
            circle_search &mdash; Circle current area for better observation.
          </li>
        </ul>
      </div>
    </div>
  );
};
