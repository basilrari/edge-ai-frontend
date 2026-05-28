"use client";

import React, { useEffect, useRef } from "react";
import type { DroneTelemetry } from "./types";

interface Props {
  telemetry: DroneTelemetry | null;
  connected?: boolean;
  /** Future: live camera feed behind the attitude symbology */
  cameraUrl?: string | null;
}

const PX_PER_DEG = 4.2;
const TAPE_SPAN = 30;

function fmtNum(v: number | undefined, d = 0): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(d);
}

function drawTape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y0: number,
  h: number,
  centerVal: number,
  step: number,
  suffix: string,
  side: "left" | "right"
) {
  const midY = y0 + h / 2;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x, y0, side === "left" ? 52 : 52, h);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(x, y0, 52, h);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  for (let d = -TAPE_SPAN; d <= TAPE_SPAN; d += step) {
    const val = centerVal + d;
    const py = midY - d * PX_PER_DEG;
    if (py < y0 + 8 || py > y0 + h - 8) continue;
    const isCenter = Math.abs(d) < step * 0.5;
    ctx.fillStyle = isCenter ? "#fbbf24" : "#e2e8f0";
    ctx.font = isCenter ? "bold 13px ui-monospace, monospace" : "11px ui-monospace, monospace";
    ctx.fillText(`${val.toFixed(0)}`, x + 26, py + 4);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    const tickLen = isCenter ? 14 : 8;
    const x0 = side === "left" ? x + 52 - tickLen : x;
    const x1 = side === "left" ? x + 52 : x + tickLen;
    ctx.moveTo(x0, py);
    ctx.lineTo(x1, py);
    ctx.stroke();
  }
  ctx.fillStyle = "#94a3b8";
  ctx.font = "9px sans-serif";
  ctx.fillText(suffix, x + 26, y0 + h - 4);
}

function drawHeading(
  ctx: CanvasRenderingContext2D,
  w: number,
  heading: number
) {
  const y = 28;
  const cx = w / 2;
  const tapeW = 280;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(cx - tapeW / 2, 4, tapeW, 36);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(cx - tapeW / 2, 4, tapeW, 36);

  const pxPerDeg = 3.2;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  for (let d = -60; d <= 60; d += 10) {
    const hdg = (heading + d + 360) % 360;
    const px = cx + d * pxPerDeg;
    if (px < cx - tapeW / 2 + 10 || px > cx + tapeW / 2 - 10) continue;
    const label =
      hdg === 0 ? "N" : hdg === 90 ? "E" : hdg === 180 ? "S" : hdg === 270 ? "W" : String(Math.round(hdg));
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(label, px, y + 22);
    ctx.beginPath();
    ctx.moveTo(px, y + 8);
    ctx.lineTo(px, y + 14);
    ctx.strokeStyle = "#fff";
    ctx.stroke();
  }
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(cx, y + 6);
  ctx.lineTo(cx - 6, y + 16);
  ctx.lineTo(cx + 6, y + 16);
  ctx.closePath();
  ctx.fill();
}

function drawHorizon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rollDeg: number,
  pitchDeg: number
) {
  const cx = w / 2;
  const cy = h / 2 + 12;
  const roll = (rollDeg * Math.PI) / 180;
  const pitchPx = pitchDeg * PX_PER_DEG;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-roll);
  ctx.translate(0, pitchPx);

  const size = Math.max(w, h) * 2;
  ctx.fillStyle = "#5b7fa3";
  ctx.fillRect(-size, -size, size * 2, size);
  ctx.fillStyle = "#6b5e3a";
  ctx.fillRect(-size, 0, size * 2, size);

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1;
  for (let p = -40; p <= 40; p += 10) {
    if (p === 0) continue;
    const y = -p * PX_PER_DEG;
    const half = p % 20 === 0 ? 70 : 40;
    ctx.beginPath();
    ctx.moveTo(-half, y);
    ctx.lineTo(half, y);
    ctx.stroke();
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "left";
    ctx.fillText(String(Math.abs(p)), half + 4, y + 4);
  }

  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "#fbbf24";
  ctx.fillStyle = "#fbbf24";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, 8);
  ctx.moveTo(-24, 0);
  ctx.lineTo(-8, 0);
  ctx.moveTo(8, 0);
  ctx.lineTo(24, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(-6, 4);
  ctx.lineTo(6, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function AttitudeHud({
  telemetry,
  connected = false,
  cameraUrl = null,
}: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    const roll = telemetry?.roll_deg ?? 0;
    const pitch = telemetry?.pitch_deg ?? 0;
    const heading = telemetry?.heading_deg ?? 0;
    const speed = telemetry?.groundspeed_m_s ?? telemetry?.airspeed_m_s ?? 0;
    const alt = telemetry?.alt_rel_m ?? 0;

    drawHorizon(ctx, w, h, roll, pitch);
    drawHeading(ctx, w, heading);
    const tapeTop = 48;
    const tapeH = h - tapeTop - 36;
    drawTape(ctx, 8, tapeTop, tapeH, speed, 5, "m/s", "left");
    drawTape(ctx, w - 60, tapeTop, tapeH, alt, 10, "m", "right");

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, h - 32, w, 32);
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "left";
    ctx.fillText(
      `AS ${fmtNum(telemetry?.airspeed_m_s, 1)}  GS ${fmtNum(telemetry?.groundspeed_m_s, 1)}  ${telemetry?.mode ?? "—"}`,
      12,
      h - 12
    );
    ctx.textAlign = "right";
    ctx.fillText(
      telemetry?.armed ? "ARMED" : "DISARMED",
      w - 12,
      h - 12
    );

    ctx.textAlign = "left";
    ctx.font = "10px sans-serif";
    ctx.fillStyle = connected ? "#34d399" : "#f87171";
    ctx.fillText(connected ? "● LIVE" : "○ offline", 12, 18);
  }, [telemetry, connected]);

  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-slate-600/80 bg-slate-950 shadow-inner">
      {cameraUrl ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          src={cameraUrl}
          autoPlay
          muted
          playsInline
        />
      ) : null}
      <canvas ref={canvasRef} className="relative z-10 block h-72 w-full sm:h-80" />
      <div className="relative z-10 border-t border-slate-700/80 bg-slate-950/90 px-3 py-1.5 text-center text-[10px] text-slate-500">
        Camera background — wire <code className="text-slate-400">cameraUrl</code> when stream is ready
      </div>
    </div>
  );
}
