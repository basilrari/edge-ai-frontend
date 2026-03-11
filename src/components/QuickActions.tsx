"use client";

import React from "react";

interface Props {
  onSend: (prompt: string) => Promise<void> | void;
  disabled: boolean;
}

const QUICK_PROMPTS: { label: string; prompt: string }[] = [
  {
    label: "Detect humans in flooded area",
    prompt: "detect people in the flooded area",
  },
  {
    label: "Circle search for survivors",
    prompt: "circle around current area and look for survivors",
  },
  {
    label: "Hover and monitor",
    prompt: "hover in place and monitor for suspicious behaviour",
  },
  {
    label: "Return to home",
    prompt: "return to home and land safely",
  },
];

export const QuickActions: React.FC<Props> = ({ onSend, disabled }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_PROMPTS.map((q) => (
        <button
          key={q.label}
          type="button"
          className="outline text-xs"
          disabled={disabled}
          onClick={() => onSend(q.prompt)}
        >
          {q.label}
        </button>
      ))}
    </div>
  );
};
