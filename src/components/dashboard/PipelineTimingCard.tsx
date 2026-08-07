"use client";

import type { InferResult } from "../types";

function ms(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${Math.round(n)} ms`;
}

export function PipelineTimingCard({
  result,
  onCopy,
}: {
  result: InferResult | null;
  onCopy?: () => void;
}): JSX.Element | null {
  if (!result) return null;
  const { response: r, client: c } = result;
  const p = r.pipeline;

  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-900/60 p-3 text-xs text-slate-200">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-medium text-slate-100">Pipeline timing</span>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="rounded border border-slate-600 px-2 py-0.5 text-[10px] hover:bg-slate-800"
          >
            Copy JSON
          </button>
        ) : null}
      </div>
      <p className="mb-2 truncate font-mono text-[10px] text-slate-400">
        {result.request_id}
      </p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
        <dt className="text-slate-400">Browser RTT</dt>
        <dd>{ms(c.client_rtt_perf_ms)}</dd>
        <dt className="text-slate-400">Gateway queue</dt>
        <dd>{ms(p?.queue_wait_ms)}</dd>
        <dt className="text-slate-400">LLM HTTP+body</dt>
        <dd>{ms(p?.llm_http_ms ?? r.llm_latency_ms)}</dd>
        <dt className="text-slate-400">LLM parse</dt>
        <dd>{ms(p?.llm_parse_ms)}</dd>
        <dt className="text-slate-400">Apply total</dt>
        <dd>{ms(p?.apply_total_ms)}</dd>
        <dt className="text-slate-400">Handler total</dt>
        <dd>{ms(p?.handler_total_ms ?? r.latency_ms)}</dd>
        <dt className="text-slate-400">Prompt → final ACK</dt>
        <dd>{ms(p?.prompt_to_final_ack_ms)}</dd>
      </dl>
      {r.drone_steps && r.drone_steps.length > 0 ? (
        <div className="mt-3 border-t border-slate-700/60 pt-2">
          <p className="mb-1 text-slate-400">Drone steps</p>
          <ul className="space-y-1 font-mono text-[10px]">
            {r.drone_steps.map((s) => (
              <li key={s.step_id}>
                {s.tool}: http {ms(s.drone_http_ms)}
                {s.ack_wait_ms != null ? ` · ack ${ms(s.ack_wait_ms)}` : ""}
                {s.completion_status ? ` · ${s.completion_status}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
