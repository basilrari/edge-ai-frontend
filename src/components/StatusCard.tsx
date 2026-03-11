"use client";

import React, { useMemo, useState } from "react";
import type { ApiResponse, StatusResponse } from "./types";
import { motion } from "framer-motion";
import {
  Activity,
  Cpu,
  MemoryStick,
  Copy,
} from "lucide-react";

interface Props {
  status: StatusResponse | null;
  latest: ApiResponse | null;
}

interface LlmSummary {
  modelName?: string;
  finishReason?: string;
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  predictedMs?: number;
  perTokenMs?: number;
}

export const StatusCard: React.FC<Props> = ({ status, latest }) => {
  const [copied, setCopied] = useState(false);

  const state = latest?.state ?? status?.state ?? "UNKNOWN";
  const model = latest?.model ?? status?.model ?? null;
  const overrideActive =
    latest?.override_active ?? status?.override_active ?? false;
  const latency = latest?.latency_ms ?? status?.latency_ms ?? 0;
  const llmLatency = latest?.llm_latency_ms ?? status?.llm_latency_ms ?? 0;
  const memoryMb = status?.memory_estimate_mb ?? null;

  const isActive = state === "ACTIVE" || state === "OVERRIDE_ACTIVE";

  const rawText = latest?.llm_response ?? "";

  const llmSummary: LlmSummary | null = useMemo(() => {
    if (!rawText) return null;
    try {
      const parsed = JSON.parse(rawText) as any;
      const usage = parsed.usage ?? {};
      const timings = parsed.timings ?? {};
      const choice = Array.isArray(parsed.choices) && parsed.choices[0]
        ? parsed.choices[0]
        : undefined;

      return {
        modelName: parsed.model ?? parsed.id,
        finishReason: choice?.finish_reason,
        totalTokens: usage.total_tokens,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        predictedMs: timings.predicted_ms,
        perTokenMs: timings.predicted_per_token_ms,
      };
    } catch {
      return null;
    }
  }, [rawText]);

  const handleCopy = async () => {
    if (!rawText) return;
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const humanFinishReason = useMemo(() => {
    if (!llmSummary?.finishReason) return undefined;
    if (llmSummary.finishReason === "stop") return "Completed normally";
    if (llmSummary.finishReason === "length")
      return "Stopped early due to token limit";
    return llmSummary.finishReason;
  }, [llmSummary?.finishReason]);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Gateway Status
            </h2>
            <p className="text-xs text-slate-400">Live SAR orchestration</p>
          </div>
        </div>
        <span className={`badge ${isActive ? "badge-active" : ""}`}>{state}</span>
      </div>

      <motion.div
        className="grid grid-cols-2 gap-3 text-xs md:text-sm"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: 0.05 },
          },
        }}
      >
        <Metric label="Model" value={model ?? "none"} icon={Cpu} />
        <Metric
          label="Override"
          value={overrideActive ? "ACTIVE" : "inactive"}
        />
        <Metric label="Gateway latency" value={`${latency} ms`} />
        <Metric label="LLM latency" value={`${llmLatency} ms`} />
        {memoryMb !== null && (
          <Metric
            label="Memory"
            value={`${memoryMb.toFixed(2)} MB`}
            icon={MemoryStick}
          />
        )}
      </motion.div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-200">
            Last tool decision
          </h3>
          {latest && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="badge">
                category: {latest.category ?? "n/a"}
              </span>
              <span className="badge">tool: {latest.tool_name ?? "n/a"}</span>
              <span className="badge">action: {latest.action_taken}</span>
            </div>
          )}
        </div>

        {latest ? (
          <div className="mt-1 space-y-3">
            {llmSummary ? (
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-[11px] leading-relaxed text-slate-200">
                <div className="text-[11px] font-semibold text-slate-300 mb-1">
                  LLM run summary
                </div>
                <ul className="space-y-1 list-disc list-inside">
                  {llmSummary.modelName && (
                    <li>
                      <span className="font-semibold">Model</span>: {llmSummary.modelName}
                    </li>
                  )}
                  {humanFinishReason && (
                    <li>
                      <span className="font-semibold">Completion</span>: {humanFinishReason}
                    </li>
                  )}
                  {typeof llmSummary.totalTokens === "number" && (
                    <li>
                      <span className="font-semibold">Tokens</span>: total {llmSummary.totalTokens}
                      {typeof llmSummary.promptTokens === "number" &&
                        typeof llmSummary.completionTokens === "number" && (
                          <>
                            {" "}(prompt {llmSummary.promptTokens}, completion {llmSummary.completionTokens})
                          </>
                        )}
                    </li>
                  )}
                  {typeof llmSummary.predictedMs === "number" && (
                    <li>
                      <span className="font-semibold">Model compute time</span>: ~
                      {llmSummary.predictedMs.toFixed(1)} ms
                      {typeof llmSummary.perTokenMs === "number" && (
                        <>
                          {" "}(
                          {llmSummary.perTokenMs.toFixed(1)} ms / token)
                        </>
                      )}
                    </li>
                  )}
                  <li>
                    <span className="font-semibold">End-to-end latency</span>: {latency} ms
                    {llmLatency > 0 && ` (LLM portion ~${llmLatency} ms)`}
                  </li>
                </ul>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                LLM metrics not available for this response.
              </p>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Raw LLM payload</span>
                <button
                  type="button"
                  className="outline"
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="max-h-40 overflow-auto rounded-xl border border-slate-700/70 bg-slate-950/80 p-2">
                <code className="llm-response text-[11px] md:text-[11px]">
                  {rawText || "(empty)"}
                </code>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No inferences yet.</p>
        )}
      </div>
    </motion.div>
  );
};

interface MetricProps {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const Metric: React.FC<MetricProps> = ({ label, value, icon: Icon }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0 },
      }}
      className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-2"
    >
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-500" />}
      </div>
      <div className="mt-1 font-mono text-xs text-slate-100">{value}</div>
    </motion.div>
  );
};
