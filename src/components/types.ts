/** One LLM / gateway tool step (matches gateway `ToolCall`). */
export interface ToolCall {
  category: string;
  name: string;
  params?: Record<string, unknown> | null;
}

export interface PipelineTiming {
  gateway_received_ms: number;
  gateway_response_ms?: number;
  queue_wait_ms: number;
  handler_total_ms: number;
  llm_http_ms: number;
  llm_parse_ms: number;
  apply_total_ms?: number;
  prompt_to_final_ack_ms?: number;
  client_dispatch_ms?: number;
}

export interface DroneStepTiming {
  step_index: number;
  tool: string;
  step_id: string;
  drone_http_ms: number;
  dispatch_ms?: number;
  ack_wait_ms?: number;
  completion_status?: string;
  ack_result?: string;
  http_status: number;
  ok: boolean;
}

export interface ModelStepTiming {
  step_index: number;
  tool: string;
  placeholder: boolean;
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
  pipeline?: PipelineTiming | null;
  drone_steps?: DroneStepTiming[];
  model_steps?: ModelStepTiming[];
}

export interface InferClientMetrics {
  client_dispatch_perf_ms: number;
  client_received_perf_ms: number;
  client_rtt_perf_ms: number;
  client_dispatch_epoch_ms?: number;
}

export interface InferResult {
  response: ApiResponse;
  client: InferClientMetrics;
  request_id: string;
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
  battery_voltage_v?: number;
  battery_current_a?: number;
  battery_power_w?: number;
  battery_remaining_pct?: number;
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

export interface MavlinkLogEntry {
  ts_ms: number;
  msg_id: number;
  msg_name: string;
  value: string;
}

export interface LlmLogEntry {
  ts_ms: number;
  prompt: string;
  llm_tool_json?: string | null;
  action_taken?: string | null;
  model?: string | null;
  request_id: string;
}

export type LogWsMessage =
  | { type: "snapshot"; flight: FlightLogEntry[]; mavlink: MavlinkLogEntry[] }
  | { type: "flight"; entry: FlightLogEntry }
  | { type: "mavlink"; entry: MavlinkLogEntry };
