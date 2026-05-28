/** One LLM / gateway tool step (matches gateway `ToolCall`). */
export interface ToolCall {
  category: string;
  name: string;
  params?: Record<string, unknown> | null;
}

export interface ApiResponse {
  state: string;
  model: string | null;
  override_active: boolean;
  category: string | null;
  tool_name: string | null;
  pending_approval: boolean;
  llm_response: string;
  action_taken: string;
  latency_ms: number;
  llm_latency_ms: number;
  request_id?: string;
  debug_trace?: string[];
  drone_http_status?: number | null;
  drone_http_ms?: number | null;
  drone_error?: string | null;
  tool_params?: Record<string, unknown> | null;
  tools?: ToolCall[] | null;
  llm_tool_json?: string | null;
}

export interface DroneLinkInfo {
  kind: string;
  display: string;
  url: string;
}

export interface DroneTelemetry {
  ok: boolean;
  link: DroneLinkInfo;
  lat_deg?: number;
  lon_deg?: number;
  alt_amsl_m?: number;
  alt_rel_m?: number;
  groundspeed_m_s?: number;
  airspeed_m_s?: number;
  climb_m_s?: number;
  heading_deg?: number;
  roll_deg?: number;
  pitch_deg?: number;
  yaw_deg?: number;
  armed?: boolean;
  mode?: string;
  ts_ms?: number;
  home_lat_deg?: number;
  home_lon_deg?: number;
  home_alt_m?: number;
}

export interface MissionWaypoint {
  seq: number;
  lat_deg: number;
  lon_deg: number;
  alt_m: number;
  command: number;
}

export interface DroneMission {
  ok: boolean;
  current_seq?: number;
  waypoints: MissionWaypoint[];
}

export interface FlightLogEntry {
  ts_ms: number;
  level: string;
  message: string;
}
