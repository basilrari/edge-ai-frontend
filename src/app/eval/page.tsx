"use client";

import { useState } from "react";
import { AppShell } from "../../components/dashboard/AppShell";
import {
  buildInferTraceExport,
  getGatewayUrl,
  sendInferPrompt,
} from "../../lib/gateway";
import { PipelineTimingCard } from "../../components/dashboard/PipelineTimingCard";
import type { InferResult } from "../../components/types";

export default function EvalPage(): JSX.Element {
  const [prompt, setPrompt] = useState("Arm the drone");
  const [waitAck, setWaitAck] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InferResult | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await sendInferPrompt(prompt, {
        waitForAck: waitAck,
        ackTimeoutMs: 3000,
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell pageTitle="Eval / timing">
      <div className="mx-auto max-w-xl space-y-4 p-4">
        <p className="text-sm text-slate-400">
          Gateway: {getGatewayUrl()} — uses production{" "}
          <code className="text-slate-200">POST /infer</code> with client and
          pipeline timings (enable <code className="text-slate-200">DRONE_WAIT_FOR_ACK</code>{" "}
          on gateway or check wait-for-ACK below).
        </p>
        <label className="block text-sm">
          <span className="text-slate-300">Prompt</span>
          <textarea
            className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2 text-sm"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={waitAck}
            onChange={(e) => setWaitAck(e.target.checked)}
          />
          Wait for FC COMMAND_ACK (x-wait-for-ack)
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => void run()}
          className="rounded bg-cyan-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Running…" : "Run infer"}
        </button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <PipelineTimingCard
          result={result}
          onCopy={
            result
              ? () => {
                  void navigator.clipboard.writeText(buildInferTraceExport(result));
                }
              : undefined
          }
        />
      </div>
    </AppShell>
  );
}
