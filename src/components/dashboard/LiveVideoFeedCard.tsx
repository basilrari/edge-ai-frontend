"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import type { Telemetry } from "../../types/drone";

interface Props {
  telemetry: Telemetry;
  connected: boolean;
}

function fmt(v: number | undefined, d = 1): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(d);
}

function AltitudeTape({ alt }: { alt: number }): JSX.Element {
  const ticks = [-30, -20, -10, 0, 10, 20, 30];
  return (
    <div className="absolute right-2 top-12 bottom-12 w-11 overflow-hidden rounded border border-white/10 bg-black/50">
      <div className="relative flex h-full flex-col items-center justify-center">
        {ticks.map((d) => (
          <span
            key={d}
            className={`py-1 font-mono text-[9px] ${d === 0 ? "font-bold text-amber-400" : "text-slate-300"}`}
          >
            {Math.round(alt + d)}
          </span>
        ))}
      </div>
    </div>
  );
}

function SpeedTape({ speed }: { speed: number }): JSX.Element {
  const ticks = [-4, -2, 0, 2, 4];
  return (
    <div className="absolute left-2 top-12 bottom-12 w-11 overflow-hidden rounded border border-white/10 bg-black/50">
      <div className="relative flex h-full flex-col items-center justify-center">
        {ticks.map((d) => (
          <span
            key={d}
            className={`py-1.5 font-mono text-[9px] ${d === 0 ? "font-bold text-amber-400" : "text-slate-300"}`}
          >
            {Math.round(speed + d)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LiveVideoFeedCard({
  telemetry,
  connected,
}: Props): JSX.Element {
  const [elapsed, setElapsed] = useState(767); // match reference 00:12:47
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w === 0 || h === 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const roll = telemetry.roll ?? 0;
    const pitch = telemetry.pitch ?? 0;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((-roll * Math.PI) / 180);
    ctx.translate(0, pitch * 2);

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    for (let p = -30; p <= 30; p += 10) {
      if (p === 0) continue;
      const y = -p * 3;
      ctx.beginPath();
      ctx.moveTo(-40, y);
      ctx.lineTo(40, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(w, 0);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy);
    ctx.lineTo(cx - 6, cy);
    ctx.moveTo(cx + 6, cy);
    ctx.lineTo(cx + 24, cy);
    ctx.moveTo(cx, cy - 24);
    ctx.lineTo(cx, cy - 6);
    ctx.moveTo(cx, cy + 6);
    ctx.lineTo(cx, cy + 24);
    ctx.stroke();
  }, [telemetry.roll, telemetry.pitch]);

  const hh = Math.floor(elapsed / 3600);
  const mm = Math.floor((elapsed % 3600) / 60);
  const ss = elapsed % 60;
  const timer = [hh, mm, ss].map((n) => String(n).padStart(2, "0")).join(":");

  return (
    <DashboardCard
      title="Live Feed"
      className="h-full min-h-[300px]"
      headerRight={
        <button
          type="button"
          className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          aria-label="Fullscreen"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      }
      bodyClassName="relative p-0"
    >
      <div className="relative min-h-[280px] w-full overflow-hidden bg-slate-900">
        <Image
          src="/live-feed-bg.png"
          alt=""
          fill
          className="object-cover object-[52%_68%] scale-[2.8] opacity-90"
          priority
          unoptimized
        />

        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        />

        <SpeedTape speed={telemetry.speed} />
        <AltitudeTape alt={telemetry.altitude} />

        <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded bg-black/55 px-2 py-1 font-mono text-[11px] text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          LIVE {timer}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between bg-black/65 px-3 py-2 font-mono text-[10px] text-slate-200">
          <span>
            SPD {fmt(telemetry.speed)} · ALT {fmt(telemetry.altitude)} · HDG{" "}
            {String(Math.round(telemetry.heading)).padStart(3, "0")}°
          </span>
          <span className="text-slate-400">
            ISO {telemetry.cameraIso ?? 200} · {telemetry.cameraShutter ?? "1/500"} · EV{" "}
            {telemetry.cameraEv ?? "-0.3"}
          </span>
        </div>

        <div className="absolute bottom-10 left-3 z-20 h-14 w-[72px] overflow-hidden rounded border border-emerald-500/40 bg-black/60">
          <div className="relative h-full w-full bg-emerald-950/30">
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40" />
          </div>
        </div>

        {!connected && (
          <div className="absolute right-3 top-10 z-20 rounded bg-amber-950/80 px-2 py-0.5 text-[10px] text-amber-200">
            Simulated feed
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
