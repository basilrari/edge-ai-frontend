"use client";

import React, { useEffect, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";

export function BottomStatusBar(): JSX.Element {
  const [utc, setUtc] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setUtc(
        d.toLocaleTimeString("en-US", {
          timeZone: "UTC",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="flex h-9 shrink-0 items-center justify-between border-t border-dash-border bg-dash-bg px-5 text-[11px] text-dash-muted">
      <div className="flex items-center gap-2">
        <Bell className="h-3.5 w-3.5" />
        <CheckCircle2 className="h-3.5 w-3.5 text-dash-accent" />
        <span>No active alerts</span>
      </div>
      <span className="font-medium text-dash-muted">UTC {utc}</span>
    </footer>
  );
}
