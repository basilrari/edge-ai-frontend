"use client";

import React, { FormEvent, useState } from "react";

interface Props {
  onSend: (prompt: string) => Promise<void> | void;
  loading: boolean;
  error: string | null;
}

export const PromptForm: React.FC<Props> = ({ onSend, loading, error }) => {
  const [value, setValue] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    await onSend(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="text-sm font-medium text-slate-200">
        Prompt
      </label>
      <textarea
        className="prompt-input"
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Describe what the SAR drone should do..."
      />
      <div className="flex items-center justify-between gap-2">
        <button
          type="submit"
          className="primary"
          disabled={loading || !value.trim()}
        >
          {loading ? "Sending..." : "Send Prompt"}
        </button>
        {error && <p className="text-xs text-danger">Error: {error}</p>}
      </div>
    </form>
  );
};
