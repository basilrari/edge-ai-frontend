import type {
  ModelGrid,
  ModelHuman,
  ModelServerPayload,
  ModelSwitch,
} from "../types/modelServer";

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function fmtFixed(v: unknown, digits: number): string {
  const n = num(v);
  return n == null ? "—" : n.toFixed(digits);
}

function fmtMs(v: unknown): string {
  const n = num(v);
  return n == null ? "—" : `${n.toFixed(1)} ms`;
}

function fmtPct(v: unknown): string {
  const n = num(v);
  return n == null ? "—" : `${n.toFixed(0)}%`;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function switchLabel(sw: ModelSwitch | null | undefined): string {
  if (!sw?.from || !sw?.to) return "none";
  const fromL = sw.from_label || sw.from;
  const toL = sw.to_label || sw.to;
  const reason = sw.reason ? ` (${sw.reason})` : "";
  return `${fromL} → ${toL}${reason}`;
}

export interface FloodView {
  primaryModel: string;
  segMode: string;
  segPrimary: string;
  segBackend: string;
  segSkipped: string;
  segMs: string;
  ctxAlt: string;
  ctxPriority: string;
  ctxVisibility: string;
  ctxFlood: string;
  ctxClf: string;
  ctxPower: string;
  classification: string;
  floodRatio: string;
  lat: string;
  lon: string;
  cell: string;
  cellRatio: string;
  overlayMode: string;
  show: boolean;
}

export interface HumanView {
  primaryModel: string;
  tierMode: string;
  backend: string;
  tierSwitch: string;
  ctxAlt: string;
  ctxPriority: string;
  ctxFlood: string;
  ctxBattery: string;
  count: string;
  list: string;
  gpsList: string;
  overlayMode: string;
  show: boolean;
}

export interface PerfView {
  latency: string;
  fps: string;
  memoryMb: string;
  cpuPct: string;
  clfMs: string;
  segMs: string;
  detMs: string;
  idleW: string;
  inferenceW: string;
  extraW: string;
  modelSwitch: string;
}

export interface ModelDashboardView {
  activeTool: string;
  activeTools: string[];
  inferenceActive: boolean;
  combined: boolean;
  systemStatus: string;
  inputSource: string;
  cameraDevice: string;
  overlayMode: string;
  gpsText: string;
  flood: FloodView;
  human: HumanView;
  perf: PerfView;
}

const EMPTY_FLOOD: FloodView = {
  primaryModel: "—",
  segMode: "auto",
  segPrimary: "—",
  segBackend: "—",
  segSkipped: "—",
  segMs: "—",
  ctxAlt: "—",
  ctxPriority: "—",
  ctxVisibility: "—",
  ctxFlood: "—",
  ctxClf: "—",
  ctxPower: "—",
  classification: "—",
  floodRatio: "—",
  lat: "—",
  lon: "—",
  cell: "—",
  cellRatio: "—",
  overlayMode: "none",
  show: false,
};

const EMPTY_HUMAN: HumanView = {
  primaryModel: "—",
  tierMode: "auto",
  backend: "—",
  tierSwitch: "none",
  ctxAlt: "—",
  ctxPriority: "—",
  ctxFlood: "—",
  ctxBattery: "—",
  count: "—",
  list: "",
  gpsList: "—",
  overlayMode: "none",
  show: false,
};

const EMPTY_PERF: PerfView = {
  latency: "—",
  fps: "—",
  memoryMb: "—",
  cpuPct: "—",
  clfMs: "—",
  segMs: "—",
  detMs: "—",
  idleW: "—",
  inferenceW: "—",
  extraW: "—",
  modelSwitch: "none",
};

export const EMPTY_MODEL_VIEW: ModelDashboardView = {
  activeTool: "idle",
  activeTools: [],
  inferenceActive: false,
  combined: false,
  systemStatus: "IDLE",
  inputSource: "idle",
  cameraDevice: "—",
  overlayMode: "—",
  gpsText: "",
  flood: EMPTY_FLOOD,
  human: EMPTY_HUMAN,
  perf: EMPTY_PERF,
};

function isCombined(tool: string, tools: string[]): boolean {
  return (
    tool === "detect_combined" ||
    (tools.includes("detect_flood") && tools.includes("detect_human"))
  );
}

function floodSegFromPayload(data: ModelServerPayload): Record<string, unknown> {
  const seg = asRecord(data.flood_segmenter);
  if (str(seg.tier)) return seg;
  const models = asRecord(data.active_models);
  if (models.segmenter_tier) {
    return {
      tier: models.segmenter_tier,
      segmenter_label: models.segmenter,
      mode: seg.mode || "auto",
    };
  }
  return seg;
}

function humanModelsFromPayload(data: ModelServerPayload): Record<string, unknown> {
  const models = asRecord(data.active_models);
  if (models.tier) return models;
  const nested = data.human_detection;
  if (nested) {
    const hm = asRecord(nested.active_models);
    if (Object.keys(hm).length) return hm;
  }
  const det = asRecord(data.human_detector);
  if (det.tier) return det;
  return det;
}

function decisionBasis(
  ...candidates: Array<Record<string, unknown> | undefined>
): Record<string, unknown> {
  for (const c of candidates) {
    if (!c) continue;
    const nested = asRecord(asRecord(c.metadata).decision_basis);
    if (Object.keys(nested).length) return nested;
    const direct = asRecord(c.decision_basis);
    if (Object.keys(direct).length) return direct;
  }
  return {};
}

function mapFlood(data: ModelServerPayload, show: boolean): FloodView {
  const m = asRecord(data.metrics);
  const models = asRecord(data.active_models);
  const status = asRecord(data.flood_segmenter);
  const segInfo = floodSegFromPayload(data);
  const mode = str(status.mode) || str(segInfo.mode) || "auto";
  const inferenceActive = Boolean(
    status.inference_active ||
      data.active_tool === "detect_flood" ||
      data.active_tool === "detect_combined" ||
      data.task === "detect_flood" ||
      data.task === "detect_combined"
  );
  const tier = inferenceActive
    ? str(segInfo.tier) || str(models.segmenter_tier) || str(status.tier)
    : null;
  const label =
    tier === "robust" ? "Robust" : tier === "lightweight" ? "Lightweight" : "—";

  const floodRatio = num(
    asRecord(data.segmentation).flood_ratio ?? m.flood_ratio
  );
  const segActive =
    (floodRatio != null && floodRatio >= 0.2) ||
    Boolean(data.segmentation_active ?? asRecord(data.segmentation).active);
  const classification = show
    ? segActive
      ? "Flooded"
      : "Non-Flooded"
    : "—";

  const basis = {
    ...asRecord(data.context),
    ...decisionBasis(asRecord(segInfo.metadata), asRecord(status.last_selection)),
  };
  const clfLabel =
    str(basis.classification_label) ||
    str(asRecord(data.classification).raw_label) ||
    (basis.clf_class_index === 0
      ? "Flood"
      : basis.clf_class_index === 1
        ? "Non-Flood"
        : null);
  const batt = num(basis.battery);
  const cpu = num(basis.cpu_usage);

  const grid = (data.grid ?? {}) as ModelGrid;
  const hasGrid = grid.centroid != null;
  const cell = grid.best_cell;

  return {
    primaryModel: str(models.primary) || str(data.primary_model) || "—",
    segMode: mode === "forced" ? "forced" : "auto",
    segPrimary: tier ? label : "—",
    segBackend: str(models.segmenter_backend) || str(status.backend) || "—",
    segSkipped:
      m.segmentation_skipped == null
        ? "—"
        : m.segmentation_skipped
          ? "yes"
          : "no",
    segMs: m.segmentation_ms != null ? fmtMs(m.segmentation_ms) : "—",
    ctxAlt: num(basis.altitude) != null ? `${fmtFixed(basis.altitude, 1)} m` : "—",
    ctxPriority: fmtFixed(basis.priority, 2),
    ctxVisibility: fmtFixed(basis.visibility, 2),
    ctxFlood: fmtFixed(basis.flood_ratio, 3),
    ctxClf: clfLabel ?? "—",
    ctxPower: `${batt != null ? `${batt.toFixed(0)}%` : "—"} / ${
      cpu != null ? `${cpu.toFixed(0)}%` : "—"
    }`,
    classification,
    floodRatio: fmtFixed(asRecord(data.segmentation).flood_ratio ?? 0, 3),
    lat: hasGrid && grid.latitude != null ? Number(grid.latitude).toFixed(6) : "—",
    lon:
      hasGrid && grid.longitude != null ? Number(grid.longitude).toFixed(6) : "—",
    cell:
      hasGrid && cell && cell.row != null && cell.col != null
        ? `row ${cell.row + 1}, col ${cell.col + 1}`
        : "—",
    cellRatio:
      hasGrid && grid.max_cell_ratio != null
        ? Number(grid.max_cell_ratio).toFixed(3)
        : "—",
    overlayMode: segActive
      ? `4×4 grid (${str(models.segmenter) || "DeepLab"})`
      : "none (ResNet)",
    show,
  };
}

function mapHuman(data: ModelServerPayload, show: boolean, combined: boolean): HumanView {
  const src = (data.human_detection ?? data) as ModelServerPayload;
  const humans: ModelHuman[] = src.humans ?? src.detections ?? [];
  const status = asRecord(data.human_detector);
  const models = humanModelsFromPayload(data);
  const mode = str(status.mode) || str(models.mode) || "auto";
  const inferenceActive = Boolean(
    status.inference_active ||
      data.active_tool === "detect_human" ||
      data.active_tool === "detect_combined" ||
      data.task === "detect_human" ||
      data.task === "detect_combined"
  );
  const tier = inferenceActive
    ? str(models.tier) || str(status.tier)
    : null;
  const label =
    tier === "robust"
      ? "YOLO11s VisDrone"
      : tier === "lightweight"
        ? "YOLOv8n"
        : "—";

  const sw =
    (status.last_switch as ModelSwitch | undefined) ||
    data.model_switches?.tier ||
    (asRecord(asRecord(data.human_detector).tier_switches).tier as ModelSwitch | undefined);

  const sel = asRecord(models.selection);
  const basis = decisionBasis(
    sel,
    asRecord(status.last_selection),
    asRecord(status.metadata)
  );

  const list = humans
    .map((h, i) => {
      const n = h.human_index ?? i + 1;
      const bbox = Array.isArray(h.bbox) ? h.bbox.join(",") : "";
      return `#${n} ${h.label || "human"} conf=${h.confidence ?? "—"} bbox=[${bbox}]`;
    })
    .join(" | ");

  const gps =
    humans.length === 0
      ? "—"
      : humans
          .map((h, i) => {
            const n = h.human_index ?? i + 1;
            if (h.latitude == null || h.longitude == null) {
              return `#${n}: GPS unavailable`;
            }
            return `Human ${n} — ${Number(h.latitude).toFixed(6)}, ${Number(h.longitude).toFixed(6)} (conf ${h.confidence ?? "—"})`;
          })
          .join("\n");

  const overlay =
    !combined && show
      ? `${label === "—" ? "YOLOv8n" : label} human boxes`
      : "none";

  return {
    primaryModel: tier ? label : "—",
    tierMode: mode === "forced" ? "forced" : "auto",
    backend: str(models.backend) || str(status.backend) || "—",
    tierSwitch: switchLabel(sw),
    ctxAlt: num(basis.altitude) != null ? `${fmtFixed(basis.altitude, 1)} m` : "—",
    ctxPriority: fmtFixed(basis.priority, 2),
    ctxFlood: fmtFixed(basis.flood_ratio, 3),
    ctxBattery: fmtPct(basis.battery),
    count: show ? String(src.human_count ?? humans.length) : "—",
    list: show ? list || "No humans in frame" : "",
    gpsList: show ? gps : "—",
    overlayMode: overlay,
    show,
  };
}

function mapPerf(data: ModelServerPayload, combined: boolean, flood: boolean, human: boolean): PerfView {
  const m = asRecord(data.metrics);
  const hm = asRecord(asRecord(data.human_detection).metrics);
  const p = asRecord(data.power);
  let latency = num(m.total_latency_ms ?? m.combined_latency_ms ?? data.system?.latency_ms);
  if (latency == null && combined && hm.detection_ms != null) {
    latency =
      (num(m.classification_ms) ?? 0) +
      (num(m.segmentation_ms) ?? 0) +
      (num(hm.detection_ms) ?? 0);
  }
  const fps = num(m.instant_fps ?? data.system?.fps ?? hm.instant_fps);
  let switchText = "none";
  if (data.model_switches?.primary?.from && data.model_switches.primary.to) {
    switchText = `${data.model_switches.primary.from} → ${data.model_switches.primary.to}`;
  }

  return {
    latency: latency != null ? latency.toFixed(1) : "—",
    fps: fps != null ? String(fps) : "—",
    memoryMb: m.memory_mb != null ? String(m.memory_mb) : "—",
    cpuPct: m.cpu_percent != null ? String(m.cpu_percent) : "—",
    clfMs: flood && m.classification_ms != null ? String(m.classification_ms) : "—",
    segMs: flood && m.segmentation_ms != null ? String(m.segmentation_ms) : "—",
    detMs:
      human
        ? String(m.detection_ms ?? hm.detection_ms ?? data.metrics?.human_detection_ms ?? "—")
        : "—",
    idleW: String(p.idle_power_w ?? m.idle_power_w ?? "—"),
    inferenceW: String(p.inference_power_w ?? m.inference_power_w ?? "—"),
    extraW: String(p.extra_power_w ?? m.extra_power_w ?? "—"),
    modelSwitch: switchText,
  };
}

function gpsTextFrom(data: ModelServerPayload, flood: FloodView): string {
  const grid = data.grid;
  if (flood.show && grid?.latitude != null && grid.longitude != null) {
    return `Most flooded cell (simulated): ${Number(grid.latitude).toFixed(6)}, ${Number(grid.longitude).toFixed(6)}`;
  }
  return grid?.gps_text || "";
}

/** Map a Drone_LLM `/status` or `/ws/live` JSON body to Camera dashboard fields. */
export function mapModelPayload(data: ModelServerPayload | null): ModelDashboardView {
  if (!data || data.error) return EMPTY_MODEL_VIEW;

  const tool = str(data.active_tool) || str(data.task) || "idle";
  const tools = Array.isArray(data.active_tools) ? data.active_tools.map(String) : [];
  const combined = isCombined(tool, tools);
  const idle = tool === "idle" || data.status === "idle";
  const showFlood = !idle && (tool === "detect_flood" || combined);
  const showHuman = !idle && (tool === "detect_human" || combined);

  if (idle) {
    return {
      ...EMPTY_MODEL_VIEW,
      systemStatus: str(data.system?.status) || "IDLE",
      inputSource: str(data.input_source) || (data.offline ? "offline_video" : "idle"),
    };
  }

  const flood = mapFlood(data, showFlood);
  const human = mapHuman(data, showHuman, combined);
  const overlay = combined
    ? str(data.overlay_mode) || "flood grid + human boxes"
    : showFlood
      ? flood.overlayMode
      : human.overlayMode;

  return {
    activeTool: combined ? "detect_flood + detect_human" : tool,
    activeTools: combined ? ["detect_flood", "detect_human"] : tools,
    inferenceActive: true,
    combined,
    systemStatus: str(data.system?.status) || "NORMAL",
    inputSource: str(data.input_source) || (data.offline ? "offline_video" : "camera"),
    cameraDevice: str(data.camera?.device) || "—",
    overlayMode: overlay,
    gpsText: gpsTextFrom(data, flood),
    flood,
    human,
    perf: mapPerf(data, combined, showFlood, showHuman),
  };
}
