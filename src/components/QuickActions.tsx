"use client";

import React from "react";
import { motion } from "framer-motion";
import { ScanEye, Network, Brain, Share2, Waves } from "lucide-react";

interface Props {
  onSelect: (prompt: string) => Promise<void> | void;
  disabled: boolean;
}

// Quick prompts that are designed to trigger MODEL tools only.
const QUICK_PROMPTS: {
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    label: "Activate human detection (vision)",
    prompt:
      "activate human detection on the live camera feed in the flooded area",
    icon: ScanEye,
  },
  {
    label: "Flood segmentation (vision)",
    prompt:
      "run flood segmentation on the current camera view and highlight flooded zones",
    icon: Waves,
  },
  {
    label: "Behaviour analysis (vision)",
    prompt:
      "analyze human behaviour in the scene and flag distressed or suspicious activity",
    icon: Brain,
  },
  {
    label: "Share detections with swarm",
    prompt:
      "share the current detection results with the drone swarm for coordination",
    icon: Share2,
  },
];

export const QuickActions: React.FC<Props> = ({ onSelect, disabled }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Quick model actions (tools)</span>
      </div>
      {/* Mobile: vertical list of big buttons; Desktop: 2-column grid */}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-2">
        {QUICK_PROMPTS.map((q) => (
          <motion.button
            key={q.label}
            type="button"
            className="outline w-full justify-start py-2"
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={() => onSelect(q.prompt)}
          >
            <q.icon className="mr-2 h-4 w-4 text-cyan-300" />
            <span className="text-left text-[12px] md:text-xs leading-snug">
              {q.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
