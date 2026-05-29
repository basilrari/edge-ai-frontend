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
export function normalizeBatteryVoltageV(
  voltageV: number | null | undefined
): number | null {
  if (voltageV == null || !Number.isFinite(voltageV)) return null;
  let v = voltageV;
  // Raw millivolts leaked into the volts field (e.g. 12600).
  if (v >= 1000) v /= 1000;
  // Legacy backend sent centivolts (12600 mV / 100 = 126).
  if (v > 60) v /= 10;
  if (v <= 0 || v > 60) return null;
  return v;
}

/** Map overlay: pack V / A / W (+ optional %) from MAVLink SYS_STATUS. */
export function fmtBatteryPowerBadge(
  voltageV: number | null | undefined,
  currentA: number | null | undefined,
  powerW: number | null | undefined,
  remainingPct: number | null | undefined
): { label: string; live: boolean } {
  const normalizedV = normalizeBatteryVoltageV(voltageV);
  const parts: string[] = [];
  if (normalizedV != null) {
    parts.push(`${normalizedV.toFixed(1)} V`);
  }
  if (currentA != null && Number.isFinite(currentA)) {
    parts.push(`${currentA.toFixed(1)} A`);
  }
  const computedPower =
    normalizedV != null && currentA != null && Number.isFinite(currentA)
      ? normalizedV * currentA
      : powerW;
  if (computedPower != null && Number.isFinite(computedPower)) {
    parts.push(`${Math.round(computedPower)} W`);
  }
  if (remainingPct != null && Number.isFinite(remainingPct)) {
    parts.push(`${Math.round(remainingPct)}%`);
  }
  if (parts.length === 0) {
    return { label: "Battery —", live: false };
  }
  return { label: parts.join(" · "), live: true };
}
