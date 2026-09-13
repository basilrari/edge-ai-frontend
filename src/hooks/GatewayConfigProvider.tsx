"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getGatewayUrl } from "../lib/gateway";

type GatewayConfig = {
  gatewayUrl: string | null;
  gatewayError: string | null;
  ready: boolean;
};

const GatewayConfigContext = createContext<GatewayConfig | null>(null);

export function GatewayConfigProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setGatewayUrl(getGatewayUrl());
      setGatewayError(null);
    } catch (e) {
      setGatewayUrl(null);
      setGatewayError(
        e instanceof Error ? e.message : "NEXT_PUBLIC_GATEWAY_URL is not set"
      );
    } finally {
      setReady(true);
    }
  }, []);

  return (
    <GatewayConfigContext.Provider
      value={{ gatewayUrl, gatewayError, ready }}
    >
      {children}
    </GatewayConfigContext.Provider>
  );
}

export function useGatewayConfig(): GatewayConfig {
  const ctx = useContext(GatewayConfigContext);
  if (!ctx) {
    throw new Error("useGatewayConfig must be used within GatewayConfigProvider");
  }
  return ctx;
}

/** Resolved gateway base URL; null until client mount or when misconfigured. */
export function useGatewayUrl(): string | null {
  return useGatewayConfig().gatewayUrl;
}
