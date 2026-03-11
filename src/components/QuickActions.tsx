"use client";

import React from "react";
import { motion } from "framer-motion";
import { ScanEye, Radar, Eye, Home } from "lucide-react";

interface Props {
  onSelect: (prompt: string) => Promise<void> | void;
  disabled: boolean;
}

const QUICK_PROMPTS: {
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    label: "Detect humans in flooded area",
    prompt: "detect people in the flooded area",
    icon: ScanEye,
  },
  {
    label: "Circle search for survivors",
    prompt: "circle around current area and look for survivors",
    icon: Radar,
  },
  {
    label: "Hover and monitor",
    prompt: "hover in place and monitor for suspicious behaviour",
    icon: Eye,
  },
  {
    label: "Return to home",
    prompt: "return to home and land safely",
    icon: Home,
  },
];

export const QuickActions: React.FC<Props> = ({ onSelect, disabled }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Quick actions</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible">
        {QUICK_PROMPTS.map((q) => (
          <motion.button
            key={q.label}
            type="button"
            className="outline min-w-[210px] justify-start"
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={() => onSelect(q.prompt)}
          >
            <q.icon className="mr-2 h-4 w-4 text-cyan-300" />
            <span className="text-left text-[11px] md:text-xs leading-snug">
              {q.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
