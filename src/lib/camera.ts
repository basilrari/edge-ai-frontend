import { getGatewayUrl } from "./gateway";

/** MJPEG live view proxied by the gateway from the model server camera. */
export function cameraStreamUrl(): string {
  const base = getGatewayUrl().replace(/\/$/, "");
  return `${base}/camera/stream`;
}
