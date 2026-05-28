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
