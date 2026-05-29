import { GATEWAY_URL } from "./gateway";

/** MJPEG live view proxied by the gateway from the model server camera. */
export function cameraStreamUrl(): string {
  const base = GATEWAY_URL.replace(/\/$/, "");
  return `${base}/camera/stream`;
}
