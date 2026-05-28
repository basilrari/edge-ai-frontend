"use client";

import React, { FormEvent, useState } from "react";
import { FileUp, Info, LayoutTemplate, Loader2, Send } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { MAX_PROMPT_CHARS, PROMPT_PLACEHOLDER } from "../../lib/mockData";

interface Props {
  onSend: (prompt: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

export function MissionPromptCard({
  onSend,
  loading,
  error,
  successMessage,
}: Props): JSX.Element {
  const [value, setValue] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    await onSend(trimmed);
  };

  return (
    <DashboardCard
      title="Send Prompt / Mission"
      className="h-full"
      headerRight={<Info className="h-3.5 w-3.5 text-slate-500" aria-hidden />}
    >
      <form onSubmit={handleSubmit} className="flex h-full flex-col gap-3">
        <textarea
          className="prompt-input min-h-[160px] flex-1 resize-none text-[13px] leading-relaxed"
          value={value}
          onChange={(e) =>
            setValue(e.target.value.slice(0, MAX_PROMPT_CHARS))
          }
          placeholder={PROMPT_PLACEHOLDER}
          disabled={loading}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="outline text-xs" disabled>
            <LayoutTemplate className="h-3.5 w-3.5" />
            Templates
          </button>
          <button type="button" className="outline text-xs" disabled>
            <FileUp className="h-3.5 w-3.5" />
            Upload KML
          </button>
          <span className="ml-auto font-mono text-[11px] text-slate-500">
            {value.length} / {MAX_PROMPT_CHARS}
          </span>
        </div>

        <button
          type="submit"
          className="primary send-drone-btn w-full py-3.5 text-sm font-semibold"
          disabled={loading || !value.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send to Drone
            </>
          )}
        </button>

        {error && (
          <p className="rounded-md border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}
        {successMessage && !loading && (
          <p className="rounded-md border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300">
            {successMessage}
          </p>
        )}
      </form>
    </DashboardCard>
  );
}
