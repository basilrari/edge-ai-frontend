export function fmtNum(v: number | null | undefined, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

export function fmtInt(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return String(Math.round(v));
}

export function fmtHeading(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return String(Math.round(v)).padStart(3, "0");
}

/** Human label for drone-http `link.kind` (MAVProxy UDP vs USB serial). */
export function fmtLinkKind(kind: string | null | undefined): string | null {
  if (!kind) return null;
  if (kind === "serial_usb") return "Real Drone (Serial)";
  if (kind === "udp_mavproxy") return "MAVProxy";
  return kind.replace(/_/g, " ");
}

/** Map overlay: pack V / A / W (+ optional %) from MAVLink SYS_STATUS. */
export function fmtBatteryPowerBadge(
  voltageV: number | null | undefined,
  currentA: number | null | undefined,
  powerW: number | null | undefined,
  remainingPct: number | null | undefined
): { label: string; live: boolean } {
  const parts: string[] = [];
  if (voltageV != null && Number.isFinite(voltageV)) {
    parts.push(`${voltageV.toFixed(1)} V`);
  }
  if (currentA != null && Number.isFinite(currentA)) {
    parts.push(`${currentA.toFixed(1)} A`);
  }
  if (powerW != null && Number.isFinite(powerW)) {
    parts.push(`${Math.round(powerW)} W`);
  }
  if (remainingPct != null && Number.isFinite(remainingPct)) {
    parts.push(`${Math.round(remainingPct)}%`);
  }
  if (parts.length === 0) {
    return { label: "Battery —", live: false };
  }
  return { label: parts.join(" · "), live: true };
}
