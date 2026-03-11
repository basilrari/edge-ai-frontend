export interface ApiResponse {
  state: string;
  model: string | null;
  override_active: boolean;
  category: string | null;
  tool_name: string | null;
  llm_response: string;
  action_taken: string;
  latency_ms: number;
  llm_latency_ms: number;
}

export interface StatusResponse {
  state: string;
  model: string;
  override_active: boolean;
  latency_ms: number;
  llm_latency_ms: number;
  memory_estimate_mb: number;
}
