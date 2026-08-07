"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cameraWebRtcOfferUrl,
  fetchWebRtcIceConfig,
} from "../lib/camera";

export type CameraWebRtcState = "idle" | "connecting" | "live" | "error";

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs: number): Promise<void> {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    }, timeoutMs);
    const onChange = () => {
      if (pc.iceGatheringState === "complete") {
        window.clearTimeout(timer);
        pc.removeEventListener("icegatheringstatechange", onChange);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", onChange);
  });
}

export function useCameraWebRTC(enabled: boolean): {
  videoRef: React.RefObject<HTMLVideoElement>;
  state: CameraWebRtcState;
  error: string | null;
  retry: () => void;
} {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [state, setState] = useState<CameraWebRtcState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const teardown = useCallback(() => {
    const pc = pcRef.current;
    pcRef.current = null;
    if (pc) {
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      void pc.close();
    }
    const el = videoRef.current;
    if (el?.srcObject instanceof MediaStream) {
      el.srcObject.getTracks().forEach((t) => t.stop());
      el.srcObject = null;
    }
  }, []);

  const retry = useCallback(() => {
    teardown();
    setError(null);
    setAttempt((n) => n + 1);
  }, [teardown]);

  useEffect(() => {
    if (!enabled) {
      teardown();
      setState("idle");
      return undefined;
    }

    let cancelled = false;

    const connect = async () => {
      setState("connecting");
      setError(null);
      teardown();

      const iceConfig = await fetchWebRtcIceConfig();
      const pc = new RTCPeerConnection({
        iceServers: iceConfig.iceServers,
        iceTransportPolicy: iceConfig.iceTransportPolicy ?? "all",
      });
      pcRef.current = pc;

      pc.addTransceiver("video", { direction: "recvonly" });
      pc.ontrack = (ev) => {
        const el = videoRef.current;
        if (!el || cancelled) return;
        const stream = ev.streams[0] ?? new MediaStream([ev.track]);
        el.srcObject = stream;
        void el.play().catch(() => {});
        setState("live");
      };
      pc.onconnectionstatechange = () => {
        if (cancelled) return;
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setState("error");
          setError(`WebRTC ${pc.connectionState}`);
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitForIceGathering(pc, 4000);

        const local = pc.localDescription;
        if (!local?.sdp) {
          throw new Error("missing local SDP");
        }

        const res = await fetch(cameraWebRtcOfferUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sdp: local.sdp, type: local.type }),
        });

        const payload = (await res.json()) as {
          sdp?: string;
          type?: RTCSdpType;
          error?: string;
          detail?: unknown;
        };

        if (!res.ok) {
          const detail =
            typeof payload.detail === "string"
              ? payload.detail
              : payload.error ?? res.statusText;
          throw new Error(detail);
        }
        if (!payload.sdp || !payload.type) {
          throw new Error(payload.error ?? "invalid WebRTC answer from gateway");
        }

        await pc.setRemoteDescription({
          sdp: payload.sdp,
          type: payload.type,
        });

        // Wait for relay path when TURN-only (remote internet).
        if (iceConfig.iceTransportPolicy === "relay") {
          const connected = await new Promise<boolean>((resolve) => {
            if (pc.connectionState === "connected") {
              resolve(true);
              return;
            }
            const timer = window.setTimeout(() => resolve(false), 25000);
            const onState = () => {
              if (pc.connectionState === "connected") {
                window.clearTimeout(timer);
                pc.removeEventListener("connectionstatechange", onState);
                resolve(true);
              } else if (
                pc.connectionState === "failed" ||
                pc.connectionState === "closed"
              ) {
                window.clearTimeout(timer);
                pc.removeEventListener("connectionstatechange", onState);
                resolve(false);
              }
            };
            pc.addEventListener("connectionstatechange", onState);
          });
          if (!connected && !cancelled) {
            throw new Error(
              "WebRTC relay failed — check TURN (coturn) and firewall UDP 3478 + relay ports"
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          setState("error");
          setError(e instanceof Error ? e.message : String(e));
          teardown();
        }
      }
    };

    void connect();

    return () => {
      cancelled = true;
      teardown();
    };
  }, [enabled, attempt, teardown]);

  return { videoRef, state, error, retry };
}
