import type { ApiResponse, InferClientMetrics, InferResult } from "../components/types";

const ENV_GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "");

export function getGatewayUrl(): string {
  if (ENV_GATEWAY) return ENV_GATEWAY;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://127.0.0.1:3000";
    }
  }
  return "https://edge-ai.basilrari.com";
}

export const GATEWAY_URL = ENV_GATEWAY || "https://edge-ai.basilrari.com";

export function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `fe-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function gatewayJsonHeaders(requestId?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-request-id": requestId ?? newRequestId(),
  };
}

export interface SendInferOptions {
  waitForAck?: boolean;
  ackTimeoutMs?: number;
}

export async function sendInferPrompt(
  prompt: string,
  options?: SendInferOptions
): Promise<InferResult> {
  const requestId = newRequestId();
  const clientDispatchEpochMs = Date.now();
  const dispatchPerf = performance.now();
  const headers: HeadersInit = {
    ...gatewayJsonHeaders(requestId),
    "x-client-dispatch-ms": String(clientDispatchEpochMs),
  };
  if (options?.waitForAck) {
    (headers as Record<string, string>)["x-wait-for-ack"] = "true";
    if (options.ackTimeoutMs != null) {
      (headers as Record<string, string>)["x-ack-timeout-ms"] = String(
        options.ackTimeoutMs
      );
    }
  }

  const res = await fetch(`${getGatewayUrl()}/infer`, {
    method: "POST",
    headers,
    body: JSON.stringify({ Infer: { prompt } }),
  });
  if (!res.ok) {
    throw new Error(`infer status ${res.status}`);
  }
  const response = (await res.json()) as ApiResponse;
  const receivedPerf = performance.now();
  const client: InferClientMetrics = {
    client_dispatch_perf_ms: dispatchPerf,
    client_received_perf_ms: receivedPerf,
    client_rtt_perf_ms: receivedPerf - dispatchPerf,
    client_dispatch_epoch_ms: clientDispatchEpochMs,
  };
  return {
    response,
    client,
    request_id: response.request_id ?? requestId,
  };
}

export function buildInferTraceExport(result: InferResult): string {
  return JSON.stringify(
    {
      request_id: result.request_id,
      client: result.client,
      gateway: result.response,
      exported_at_ms: Date.now(),
    },
    null,
    2
  );
}

export interface MissionUploadResponse {
  ok: boolean;
  item_count?: number;
  error?: string;
}

export async function uploadMission(
  body: import("./missionPlanner").MissionUploadBody
): Promise<MissionUploadResponse> {
  const res = await fetch(`${getGatewayUrl()}/drone/mission/upload`, {
    method: "POST",
    headers: gatewayJsonHeaders(),
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: MissionUploadResponse;
  try {
    data = text ? (JSON.parse(text) as MissionUploadResponse) : { ok: false };
  } catch {
    throw new Error(
      res.ok
        ? "Upload returned invalid JSON"
        : `Upload failed (${res.status}): ${text || "empty response — restart gateway and drone-http"}`
    );
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `upload status ${res.status}`);
  }
  return data;
}

export interface MissionClearResponse {
  ok: boolean;
  error?: string;
}

export async function clearDroneMission(): Promise<MissionClearResponse> {
  const res = await fetch(`${getGatewayUrl()}/drone/mission/clear`, {
    method: "POST",
    headers: gatewayJsonHeaders(),
  });

  const text = await res.text();
  let data: MissionClearResponse;
  try {
    data = text ? (JSON.parse(text) as MissionClearResponse) : { ok: false };
  } catch {
    throw new Error(
      res.ok
        ? "Clear mission returned invalid JSON"
        : `Clear mission failed (${res.status}): ${text || "empty response — restart gateway and drone-http"}`
    );
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `clear mission status ${res.status}`);
  }
  return data;
}

export type LogClearTarget = "flight" | "mavlink" | "all";

export interface LogClearResponse {
  ok: boolean;
  error?: string;
}

async function parseLogClearResponse(
  res: Response,
  label: string
): Promise<LogClearResponse> {
  const text = await res.text();
  let data: LogClearResponse;
  try {
    data = text ? (JSON.parse(text) as LogClearResponse) : { ok: false };
  } catch {
    throw new Error(
      res.ok
        ? `${label} returned invalid JSON`
        : `${label} failed (${res.status}): ${text || "empty response"}`
    );
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `${label} status ${res.status}`);
  }
  return data;
}

export async function clearDroneLogs(
  target: LogClearTarget
): Promise<LogClearResponse> {
  const res = await fetch(`${getGatewayUrl()}/drone/logs/clear`, {
    method: "POST",
    headers: gatewayJsonHeaders(),
    body: JSON.stringify({ target }),
  });
  return parseLogClearResponse(res, `Clear drone logs (${target})`);
}

export async function clearAllLogs(): Promise<LogClearResponse> {
  const res = await fetch(`${getGatewayUrl()}/logs/clear-all`, {
    method: "POST",
    headers: gatewayJsonHeaders(),
  });
  return parseLogClearResponse(res, "Clear all logs");
}

export async function clearLlmLogs(): Promise<LogClearResponse> {
  const res = await fetch(`${getGatewayUrl()}/logs/llm/clear`, {
    method: "POST",
    headers: gatewayJsonHeaders(),
  });
  return parseLogClearResponse(res, "Clear LLM logs");
}
