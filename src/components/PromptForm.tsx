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
  /** Shown under the textarea, before the Send button (e.g. map picker). */
  locationPicker?: React.ReactNode;
}

export const PromptForm: React.FC<Props> = ({
  onSend,
  loading,
  error,
  value,
  onChange,
  locationPicker,
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
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm font-medium text-slate-100">
          Command prompt
        </label>
        <span className="text-[11px] text-slate-500">
          Describe what the SAR drone should do.
        </span>
      </div>
      <textarea
        className="prompt-input min-h-[100px] max-h-[200px] resize-y"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. sweep the flooded area ahead, prioritize human detection and circle around any detected clusters"
      />
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
        {locationPicker}
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          type="submit"
          className="primary h-10 min-w-[140px] w-full shrink-0 justify-center sm:w-auto"
          disabled={loading || !value.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <SendHorizonal className="h-4 w-4 shrink-0" />
              <span>Send Prompt</span>
            </>
          )}
        </motion.button>
      </div>
      {error && (
        <p className="min-w-0 text-xs text-danger sm:max-w-xl">Error: {error}</p>
      )}
    </motion.form>
  );
};
