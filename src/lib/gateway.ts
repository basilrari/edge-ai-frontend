import type { ApiResponse } from "../components/types";

export const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000";

export function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `fe-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function gatewayJsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-request-id": newRequestId(),
  };
}

export async function sendInferPrompt(prompt: string): Promise<ApiResponse> {
  const res = await fetch(`${GATEWAY_URL}/infer`, {
    method: "POST",
    headers: gatewayJsonHeaders(),
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
  const res = await fetch(`${GATEWAY_URL}/drone/mission/upload`, {
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
  const res = await fetch(`${GATEWAY_URL}/drone/mission/clear`, {
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
