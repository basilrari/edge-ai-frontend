export interface ApiResponse {
  state: string;
  model: string | null;
  override_active: boolean;
  category: string | null;
  tool_name: string | null;
  /** When true, response is a proposal; show Accept/Reject. Only ApplyTool sends to Python. */
  pending_approval: boolean;
  llm_response: string;
  action_taken: string;
  latency_ms: number;
  llm_latency_ms: number;
  /** Correlates with gateway and drone-http logs. */
  request_id?: string;
  /** Pipeline stages (e.g. llm_http_post, drone_http_begin). */
  debug_trace?: string[];
  drone_http_status?: number | null;
  drone_http_ms?: number | null;
  drone_error?: string | null;
}

export interface StatusResponse {
  state: string;
  model: string;
  override_active: boolean;
  latency_ms: number;
  llm_latency_ms: number;
  memory_estimate_mb: number;
  request_id?: string;
  debug_trace?: string[];
}
