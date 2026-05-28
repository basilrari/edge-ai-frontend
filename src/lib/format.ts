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
