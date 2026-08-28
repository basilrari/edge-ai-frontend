/** Live inference payload from aykumar21/Drone_LLM (`GET /status`, `WS /ws/live`). */

export type ModelActiveTool =
  | "idle"
  | "detect_flood"
  | "detect_human"
  | "detect_combined"
  | string;

export interface ModelGridCell {
  row?: number;
  col?: number;
}

export interface ModelGrid {
  centroid?: unknown;
  latitude?: number;
  longitude?: number;
  best_cell?: ModelGridCell;
  max_cell_ratio?: number;
  ref_latitude?: number;
  ref_longitude?: number;
  altitude_m?: number;
  gps_text?: string;
}

export interface ModelHuman {
  human_index?: number;
  label?: string;
  confidence?: number;
  bbox?: number[];
  latitude?: number;
  longitude?: number;
}

export interface ModelSwitch {
  from?: string;
  to?: string;
  from_label?: string;
  to_label?: string;
  reason?: string;
}

export interface ModelServerPayload {
  error?: string;
  status?: string;
  message?: string;
  log?: string;
  active_tool?: ModelActiveTool;
  active_tools?: string[];
  task?: string;
  inference_enabled?: boolean;
  skipped?: boolean;
  input_source?: string;
  offline?: boolean;
  overlay_mode?: string;
  primary_model?: string;
  frame_base64?: string;
  frame?: string;
  camera?: { device?: string };
  system?: {
    status?: string;
    latency_ms?: number;
    fps?: number;
  };
  metrics?: Record<string, unknown>;
  power?: Record<string, unknown>;
  classification?: { raw_label?: string; label?: string };
  segmentation?: {
    flood_ratio?: number;
    active?: boolean;
  };
  segmentation_active?: boolean;
  grid?: ModelGrid;
  humans?: ModelHuman[];
  detections?: ModelHuman[];
  human_count?: number;
  human_detection?: ModelServerPayload;
  active_models?: Record<string, unknown>;
  flood_segmenter?: Record<string, unknown>;
  human_detector?: Record<string, unknown>;
  model_switches?: {
    primary?: ModelSwitch;
    seg_tier?: ModelSwitch;
    tier?: ModelSwitch;
  };
  context?: Record<string, unknown>;
}
