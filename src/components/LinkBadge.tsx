"use client";

import React from "react";
import type { DroneLinkInfo } from "./types";
import { Cable, Radio } from "lucide-react";

interface Props {
  link: DroneLinkInfo | null;
}

export function LinkBadge({ link }: Props): JSX.Element | null {
  if (!link) return null;

  const isSerial = link.kind === "serial_usb";
  const label = isSerial ? "USB Serial" : "MAVProxy / UDP";
  const Icon = isSerial ? Cable : Radio;

  return (
    <div
      className="flex max-w-full items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-[11px] text-emerald-100"
      title={link.display}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="shrink-0 font-medium">{label}</span>
      <span className="hidden min-w-0 truncate font-mono text-[10px] text-emerald-200/80 sm:inline">
        {link.display}
      </span>
    </div>
  );
}
