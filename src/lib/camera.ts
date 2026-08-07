import { getGatewayUrl } from "./gateway";

/** WebRTC signaling (SDP offer/answer) proxied by the gateway to the camera server. */
export function cameraWebRtcOfferUrl(): string {
  const base = getGatewayUrl().replace(/\/$/, "");
  return `${base}/camera/webrtc/offer`;
}

/** ICE servers + transport policy for remote internet viewing (TURN via gateway). */
export function cameraWebRtcIceUrl(): string {
  const base = getGatewayUrl().replace(/\/$/, "");
  return `${base}/camera/webrtc/ice`;
}

/** @deprecated MJPEG fallback; live view uses WebRTC. */
export function cameraStreamUrl(): string {
  const base = getGatewayUrl().replace(/\/$/, "");
  return `${base}/camera/stream`;
}

export const DEFAULT_WEBRTC_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

export type WebRtcIceConfig = {
  iceServers: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
};

export async function fetchWebRtcIceConfig(): Promise<WebRtcIceConfig> {
  try {
    const res = await fetch(cameraWebRtcIceUrl(), { cache: "no-store" });
    if (!res.ok) {
      return { iceServers: DEFAULT_WEBRTC_ICE_SERVERS, iceTransportPolicy: "all" };
    }
    const data = (await res.json()) as {
      iceServers?: RTCIceServer[];
      iceTransportPolicy?: string;
    };
    const iceServers =
      Array.isArray(data.iceServers) && data.iceServers.length > 0
        ? data.iceServers
        : DEFAULT_WEBRTC_ICE_SERVERS;
    const policy =
      data.iceTransportPolicy === "relay" ? "relay" : ("all" as RTCIceTransportPolicy);
    return { iceServers, iceTransportPolicy: policy };
  } catch {
    return { iceServers: DEFAULT_WEBRTC_ICE_SERVERS, iceTransportPolicy: "all" };
  }
}
