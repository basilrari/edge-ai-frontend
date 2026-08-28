import { getGatewayUrl } from "./gateway";

const ENV_MODEL = process.env.NEXT_PUBLIC_MODEL_SERVER_URL?.replace(/\/$/, "");

/**
 * Drone_LLM FastAPI origin (Ayush model server).
 *
 * Direct: set `NEXT_PUBLIC_MODEL_SERVER_URL` (e.g. `http://127.0.0.1:8000`).
 * Otherwise use `{gateway}/model` so the gateway can proxy `/model/*` → `:8000/*`
 * the same way it already proxies `/camera/*`.
 */
export function getModelServerUrl(): string {
  if (ENV_MODEL) return ENV_MODEL;
  return `${getGatewayUrl()}/model`;
}

export function modelServerStatusUrl(): string {
  return `${getModelServerUrl()}/status`;
}

export function modelServerLiveWsUrl(): string {
  const http = getModelServerUrl();
  return `${http.replace(/^https:/, "wss:").replace(/^http:/, "ws:")}/ws/live`;
}
