import type { ApiResponse } from "../components/types";

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

export function inferPromptFailure(data: ApiResponse): string | null {
  const action = data.action_taken ?? "";
  if (data.state === "ERROR") {
    return data.llm_response || action || "Infer failed";
  }
  if (
    action === "parse_failed" ||
    action.startsWith("tool_parse_failed") ||
    /llm_.*failed/.test(action)
  ) {
    return action;
  }
  if (data.drone_error) return data.drone_error;
  const failed = (data.drone_steps ?? []).find((s) => !s.ok);
  if (failed) {
    return failed.ack_result
      ? `${failed.tool} ack failed: ${failed.ack_result}`
      : `${failed.tool} failed`;
  }
  return null;
}

export async function sendInferPrompt(prompt: string): Promise<ApiResponse> {
  const requestId = newRequestId();
  const res = await fetch(`${getGatewayUrl()}/infer`, {
    method: "POST",
    headers: {
      ...gatewayJsonHeaders(requestId),
      "x-client-dispatch-ms": String(Date.now()),
      "x-wait-for-ack": "true",
    },
    body: JSON.stringify({ Infer: { prompt } }),
  });
  if (!res.ok) {
    throw new Error(`infer status ${res.status}`);
  }
  return (await res.json()) as ApiResponse;
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
