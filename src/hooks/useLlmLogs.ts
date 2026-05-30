"use client";

import { useCallback, useEffect, useState } from "react";
import type { LlmLogEntry } from "../components/types";
import { newRequestId } from "../lib/gateway";

export function useLlmLogs(gatewayUrl: string): {
  entries: LlmLogEntry[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  resetEntries: () => void;
} {
  const [entries, setEntries] = useState<LlmLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const reload = useCallback(() => setRefreshNonce((n) => n + 1), []);

  const resetEntries = useCallback(() => {
    setEntries([]);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`${gatewayUrl}/logs/llm`, {
          headers: { "x-request-id": newRequestId() },
        });
        if (!res.ok) throw new Error(`llm logs HTTP ${res.status}`);
        const data = (await res.json()) as { entries?: LlmLogEntry[] };
        if (active) {
          setEntries(data.entries ?? []);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "failed to load llm logs");
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
  }, [gatewayUrl, refreshNonce]);

  return { entries, loading, error, reload, resetEntries };
}
