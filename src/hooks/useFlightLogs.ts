"use client";

import { useEffect, useState } from "react";
import type { FlightLogEntry } from "../components/types";
import { newRequestId } from "../lib/gateway";

export function useFlightLogs(gatewayUrl: string): {
  entries: FlightLogEntry[];
  loading: boolean;
  error: string | null;
} {
  const [entries, setEntries] = useState<FlightLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`${gatewayUrl}/drone/logs`, {
          headers: { "x-request-id": newRequestId() },
        });
        if (!res.ok) throw new Error(`logs HTTP ${res.status}`);
        const data = (await res.json()) as { entries?: FlightLogEntry[] };
        if (active) {
          setEntries(data.entries ?? []);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "failed to load logs");
          setLoading(false);
        }
      }
    };

    load();
    const id = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [gatewayUrl]);

  return { entries, loading, error };
}
