"use client";

import React, { FormEvent } from "react";
import { motion } from "framer-motion";
import { Loader2, SendHorizonal } from "lucide-react";

interface Props {
  onSend: (prompt: string) => Promise<void> | void;
  loading: boolean;
  error: string | null;
  value: string;
  onChange: (value: string) => void;
}

export const PromptForm: React.FC<Props> = ({
  onSend,
  loading,
  error,
  value,
  onChange,
}) => {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    await onSend(value.trim());
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-100">
          Command prompt
        </label>
        <span className="text-[11px] text-slate-500">
          Describe what the SAR drone should do.
        </span>
      </div>
      <textarea
        className="prompt-input"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. sweep the flooded area ahead, prioritize human detection and circle around any detected clusters"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          type="submit"
          className="primary w-full sm:w-auto justify-center"
          disabled={loading || !value.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <SendHorizonal className="h-4 w-4" />
              Send Prompt
            </>
          )}
        </motion.button>
        {error && (
          <p className="text-xs text-danger max-w-sm">Error: {error}</p>
        )}
      </div>
    </motion.form>
  );
};
