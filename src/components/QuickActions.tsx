"use client";

import React from "react";
import { motion } from "framer-motion";
import { ScanEye, Waves, Tag } from "lucide-react";

interface Props {
  /** Called when user picks a predefined prompt; fills the input so they can edit and send. */
  onSelect: (prompt: string) => void;
  disabled: boolean;
}

// Quick prompts that are designed to trigger MODEL tools only.
const QUICK_PROMPTS: {
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    label: "Human detection",
    prompt: "run human detection on the live camera feed to find people",
    icon: ScanEye,
  },
  {
    label: "Flood segmentation",
    prompt: "run flood segmentation on the camera view and highlight flooded zones",
    icon: Waves,
  },
  {
    label: "Flood classification",
    prompt: "classify flood type and severity from the current camera view",
    icon: Tag,
  },
];

export const QuickActions: React.FC<Props> = ({ onSelect, disabled }) => {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex min-w-0 flex-col gap-0.5 text-xs text-slate-400">
        <span className="truncate">Quick model actions (tools)</span>
        <span className="text-[11px] text-slate-500">Click to fill the prompt above; edit if needed, then press Send Prompt.</span>
      </div>
      {/* Mobile: vertical list of big buttons; Desktop: 2-column grid */}
      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        {QUICK_PROMPTS.map((q) => (
          <motion.button
            key={q.label}
            type="button"
            className="outline w-full min-w-0 justify-start py-2 text-left"
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={() => onSelect(q.prompt)}
          >
            <q.icon className="mr-2 h-4 w-4 shrink-0 text-cyan-300" />
            <span className="min-w-0 break-words text-left text-[12px] leading-snug md:text-xs">
              {q.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
