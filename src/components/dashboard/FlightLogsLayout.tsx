"use client";

import React, { useMemo, useState } from "react";
import clsx from "clsx";
import { Download, Pause, Play, Search, Trash2 } from "lucide-react";
import { AppShell } from "./AppShell";
import { useTimeDisplayContext } from "./TimeDisplayProvider";
import { useLogsStream } from "../../hooks/useLogsStream";
import { useLlmLogs } from "../../hooks/useLlmLogs";
import {
  GATEWAY_URL,
  clearAllLogs,
  clearDroneLogs,
  clearLlmLogs,
} from "../../lib/gateway";
import type { FlightLogEntry, LlmLogEntry, MavlinkLogEntry } from "../types";

function flightToCsv(
  entries: FlightLogEntry[],
  formatLogTime: (tsMs: number) => string
): string {
  const lines = ["time,level,event,data"];
  for (const e of entries) {
    const { event, data } = parseFlightRow(e);
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    lines.push(
      `${esc(formatLogTime(e.ts_ms))},${esc(e.level)},${esc(event)},${esc(data)}`
    );
  }
  return lines.join("\n");
}

function parseFlightRow(entry: FlightLogEntry): { event: string; data: string } {
  const msg = entry.message.trim();
  if (msg.startsWith("FC: ")) {
    return { event: "STATUSTEXT", data: msg.slice(4) };
  }
  const colon = msg.indexOf(": ");
  if (colon > 0 && colon < 48) {
    return { event: msg.slice(0, colon), data: msg.slice(colon + 2) };
  }
  return { event: entry.level.toUpperCase(), data: msg };
}

function prettyJson(raw: string | null | undefined): string {
  if (!raw) return "—";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ClearLogsButton({
  label,
  onClear,
  disabled,
}: {
  label: string;
  onClear: () => void | Promise<void>;
  disabled?: boolean;
}): JSX.Element {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className="inline-flex items-center gap-1.5 text-[11px] text-dash-muted hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
      onClick={async () => {
        setBusy(true);
        try {
          await onClear();
        } finally {
          setBusy(false);
        }
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {busy ? "Clearing…" : label}
    </button>
  );
}

function PanelShell({
  title,
  accent,
  headerRight,
  children,
  footer,
}: {
  title: string;
  accent: "purple" | "blue" | "green";
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}): JSX.Element {
  const accentBorder = {
    purple: "border-t-dash-purple",
    blue: "border-t-dash-blue",
    green: "border-t-dash-accent",
  }[accent];

  const accentText = {
    purple: "text-dash-purple",
    blue: "text-dash-blue",
    green: "text-dash-accent",
  }[accent];

  return (
    <section
      className={clsx(
        "dashboard-panel flex h-full min-h-0 flex-col border-t-2",
        accentBorder
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-dash-border px-4 py-2.5 min-w-0">
        <h2 className={clsx("min-w-0 shrink text-[11px] font-semibold uppercase tracking-[0.14em]", accentText)}>
          {title}
        </h2>
        {headerRight}
      </header>
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-hidden">{children}</div>
      {footer ? (
        <footer className="shrink-0 border-t border-dash-border px-4 py-2">{footer}</footer>
      ) : null}
    </section>
  );
}

function LlmOutputPanel({
  entries,
  loading,
  error,
  onClear,
}: {
  entries: LlmLogEntry[];
  loading: boolean;
  error: string | null;
  onClear: () => void | Promise<void>;
}): JSX.Element {
  const { formatLogTime, formatLogDate, label } = useTimeDisplayContext();
  const history = useMemo(() => [...entries].reverse(), [entries]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (history.length === 0) return null;
    if (selectedRequestId) {
      return history.find((e) => e.request_id === selectedRequestId) ?? history[0];
    }
    return history[0];
  }, [history, selectedRequestId]);

  React.useEffect(() => {
    const latestId = history[0]?.request_id;
    if (!latestId) return;
    setSelectedRequestId((prev) => {
      if (!prev) return latestId;
      return history.some((e) => e.request_id === prev) ? prev : latestId;
    });
  }, [history]);

  const displayJson = useMemo(
    () => prettyJson(selected?.llm_tool_json),
    [selected?.llm_tool_json]
  );

  return (
    <PanelShell
      title="LLM Parameter Output"
      accent="purple"
      headerRight={
        history.length > 0 ? (
          <span className="text-[10px] text-dash-muted">
            {history.length} {history.length === 1 ? "output" : "outputs"}
          </span>
        ) : null
      }
      footer={
        <div className="flex flex-wrap items-center gap-3">
          {selected ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[11px] text-dash-muted hover:text-dash-text"
              onClick={() =>
                downloadText(
                  `llm-output-${selected.request_id.slice(0, 8)}.json`,
                  displayJson
                )
              }
            >
              <Download className="h-3.5 w-3.5" />
              Download JSON
            </button>
          ) : null}
          <ClearLogsButton label="Clear LLM logs" onClear={onClear} disabled={entries.length === 0} />
        </div>
      }
    >
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden">
        {error && (
          <p className="shrink-0 border-b border-dash-border px-3 py-2 text-xs text-dash-amber">
            {error}
          </p>
        )}
        {loading && history.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-dash-muted">
            Waiting for LLM infer requests…
          </p>
        )}
        {!loading && history.length === 0 && !error && (
          <p className="px-4 py-6 text-center text-xs text-dash-muted">
            No LLM outputs yet. Send a mission prompt from the dashboard.
          </p>
        )}
        {history.length > 0 && (
          <>
            <div className="flex min-h-0 flex-1 flex-col border-b border-dash-border">
              <p className="shrink-0 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-dash-muted">
                History
              </p>
              <ul className="dash-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
                {history.map((entry) => {
                  const active = entry.request_id === selected?.request_id;
                  return (
                    <li key={entry.request_id}>
                      <button
                        type="button"
                        onClick={() => setSelectedRequestId(entry.request_id)}
                        title={entry.prompt}
                        className={clsx(
                          "w-full min-w-0 border-t border-dash-border/50 px-3 py-2 text-left transition-colors",
                          active
                            ? "bg-dash-purple/10"
                            : "hover:bg-dash-bg/50"
                        )}
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="shrink-0 font-mono text-[10px] text-dash-muted">
                            {formatLogTime(entry.ts_ms)}
                          </span>
                          {entry.action_taken ? (
                            <span className="shrink-0 text-[10px] text-dash-purple">
                              {entry.action_taken}
                            </span>
                          ) : null}
                          <span className="allow-wrap min-w-0 flex-1 text-[10px] text-dash-text">
                            {entry.prompt.replace(/\s+/g, " ").trim()}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {selected ? (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
                <div className="allow-wrap flex shrink-0 flex-wrap items-start gap-x-3 gap-y-1 border-b border-dash-border px-3 py-1.5 text-[10px] text-dash-muted">
                  <span className="shrink-0">
                    {formatLogDate(selected.ts_ms)} {formatLogTime(selected.ts_ms)} {label}
                  </span>
                  {selected.model ? (
                    <span className="shrink-0 font-mono">{selected.model}</span>
                  ) : null}
                  <span className="min-w-0 text-dash-text">{selected.prompt}</span>
                </div>
                <pre className="allow-wrap dash-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#0b0e14] p-2 font-mono text-[10px] leading-relaxed text-dash-text">
                  {displayJson}
                </pre>
              </div>
            ) : null}
          </>
        )}
      </div>
    </PanelShell>
  );
}

function FlightEventsPanel({
  entries,
  connected,
  error,
  onClear,
}: {
  entries: FlightLogEntry[];
  connected: boolean;
  error: string | null;
  onClear: () => void | Promise<void>;
}): JSX.Element {
  const { formatLogTime, label } = useTimeDisplayContext();
  const rows = useMemo(() => [...entries].reverse(), [entries]);

  return (
    <PanelShell
      title="Flight Logs"
      accent="blue"
      headerRight={
        <span
          className={clsx(
            "text-[10px] font-medium",
            connected ? "text-dash-blue" : "text-dash-muted"
          )}
        >
          {connected ? "Live" : "Reconnecting…"}
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-[11px] text-dash-muted hover:text-dash-text"
            disabled={entries.length === 0}
            onClick={() =>
              downloadText("flight-log.csv", flightToCsv(entries, formatLogTime))
            }
          >
            <Download className="h-3.5 w-3.5" />
            Download Flight Log (CSV)
          </button>
          <ClearLogsButton label="Clear flight logs" onClear={onClear} disabled={entries.length === 0} />
        </div>
      }
    >
      <div className="dash-scroll h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
        {error && (
          <p className="border-b border-dash-border px-3 py-2 text-xs text-dash-amber">
            {error}
          </p>
        )}
        {rows.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-dash-muted">
            No flight events yet. Logs appear when drone-http connects and runs commands.
          </p>
        )}
        {rows.length > 0 && (
          <table className="allow-wrap w-full table-fixed border-collapse font-mono text-[11px]">
            <thead className="sticky top-0 bg-dash-panel text-left text-[10px] uppercase tracking-wide text-dash-muted">
              <tr>
                <th className="w-[7.5rem] px-3 py-2 font-medium">Time ({label})</th>
                <th className="w-[5.5rem] px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="allow-wrap">
              {rows.map((e, i) => {
                const { event, data } = parseFlightRow(e);
                return (
                  <tr
                    key={`${e.ts_ms}-${i}`}
                    className="allow-wrap border-t border-dash-border/50 hover:bg-dash-bg/40"
                  >
                    <td className="whitespace-nowrap px-3 py-1.5 align-top text-dash-muted">
                      {formatLogTime(e.ts_ms)}
                    </td>
                    <td className="allow-wrap break-words px-3 py-1.5 align-top text-dash-blue">
                      {event}
                    </td>
                    <td className="allow-wrap break-words px-3 py-1.5 align-top text-dash-text">
                      {data}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </PanelShell>
  );
}

function PixhawkLogsPanel({
  entries,
  connected,
  onClear,
}: {
  entries: MavlinkLogEntry[];
  connected: boolean;
  onClear: () => void | Promise<void>;
}): JSX.Element {
  const { formatLogTime, label } = useTimeDisplayContext();
  const [paused, setPaused] = useState(false);
  const [frozenEntries, setFrozenEntries] = useState<MavlinkLogEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const sourceEntries = paused ? frozenEntries : entries;

  const togglePause = (): void => {
    if (paused) {
      setPaused(false);
      return;
    }
    setFrozenEntries([...entries]);
    setPaused(true);
  };

  const rows = useMemo(() => {
    let list = [...sourceEntries];
    if (filter) {
      list = list.filter((e) => e.msg_name === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.msg_name.toLowerCase().includes(q) ||
          e.value.toLowerCase().includes(q)
      );
    }
    if (!paused) {
      list = list.slice(-200);
    }
    return [...list].reverse();
  }, [sourceEntries, filter, search, paused]);

  const messageTypes = useMemo(() => {
    const set = new Set(entries.map((e) => e.msg_name));
    return Array.from(set).sort();
  }, [entries]);

  const exportLines = entries
    .map(
      (e) =>
        `${formatLogTime(e.ts_ms)}\t${e.msg_id}\t${e.msg_name}\t${e.value.replace(/\t/g, " ")}`
    )
    .join("\n");

  return (
    <PanelShell
      title="Pixhawk Logs"
      accent="green"
      headerRight={
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-dash-muted" />
            <input
              type="search"
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
              placeholder="Search…"
              className="w-28 rounded border border-dash-border bg-dash-bg py-1 pl-7 pr-2 text-[10px] text-dash-text placeholder:text-dash-muted focus:outline-none focus:ring-1 focus:ring-dash-accent/40"
            />
          </div>
          <select
            value={filter}
            onChange={(ev) => setFilter(ev.target.value)}
            className="rounded border border-dash-border bg-dash-bg px-2 py-1 text-[10px] text-dash-text"
          >
            <option value="">All messages</option>
            {messageTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={togglePause}
            className={clsx(
              "inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px]",
              paused
                ? "border-dash-accent/40 text-dash-accent"
                : "border-dash-border text-dash-muted hover:text-dash-text"
            )}
          >
            {paused ? (
              <>
                <Play className="h-3 w-3" /> Resume
              </>
            ) : (
              <>
                <Pause className="h-3 w-3" /> Pause
              </>
            )}
          </button>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[11px] text-dash-muted hover:text-dash-text"
              disabled={entries.length === 0}
              onClick={() => downloadText("pixhawk-log.txt", exportLines)}
            >
              <Download className="h-3.5 w-3.5" />
              Download Log
            </button>
            <ClearLogsButton label="Clear Pixhawk logs" onClear={onClear} disabled={entries.length === 0} />
          </div>
          <span
            className={clsx(
              "flex items-center gap-1.5 text-[10px] font-medium",
              paused
                ? "text-dash-amber"
                : connected
                  ? "text-dash-accent"
                  : "text-dash-muted"
            )}
          >
            <span
              className={clsx(
                "h-1.5 w-1.5 rounded-full",
                paused
                  ? "bg-dash-amber"
                  : connected
                    ? "animate-pulse bg-dash-accent"
                    : "bg-dash-muted"
              )}
            />
            {paused ? "Paused" : connected ? "Streaming Live" : "Offline"}
          </span>
        </div>
      }
    >
      <div className="dash-scroll h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
        {rows.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-dash-muted">
            Waiting for MAVLink telemetry from the flight controller…
          </p>
        )}
        {rows.length > 0 && (
          <table className="allow-wrap w-full table-fixed border-collapse font-mono text-[11px]">
            <thead className="sticky top-0 bg-dash-panel text-left text-[10px] uppercase tracking-wide text-dash-muted">
              <tr>
                <th className="w-[7.5rem] px-3 py-2 font-medium">Time ({label})</th>
                <th className="w-[4.5rem] px-3 py-2 font-medium">Message ID</th>
                <th className="w-[8.5rem] px-3 py-2 font-medium">Message</th>
                <th className="px-3 py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="allow-wrap">
              {rows.map((e, i) => (
                <tr
                  key={`${e.ts_ms}-${e.msg_id}-${i}`}
                  className="allow-wrap border-t border-dash-border/50 hover:bg-dash-bg/40"
                >
                  <td className="whitespace-nowrap px-3 py-1.5 align-top text-dash-muted">
                    {formatLogTime(e.ts_ms)}
                  </td>
                  <td className="allow-wrap px-3 py-1.5 align-top text-dash-muted">{e.msg_id}</td>
                  <td className="allow-wrap break-words px-3 py-1.5 align-top text-dash-accent">
                    {e.msg_name}
                  </td>
                  <td className="allow-wrap break-words px-3 py-1.5 align-top text-dash-text">
                    {e.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PanelShell>
  );
}

export function FlightLogsLayout(): JSX.Element {
  const gatewayUrl = GATEWAY_URL;
  const { flightEntries, mavlinkEntries, connected, error, reload: reloadDroneLogs } =
    useLogsStream(gatewayUrl);
  const {
    entries: llmEntries,
    loading: llmLoading,
    error: llmError,
    reload: reloadLlmLogs,
  } = useLlmLogs(gatewayUrl);

  const handleClearAll = async () => {
    await clearAllLogs();
    reloadLlmLogs();
    reloadDroneLogs();
  };

  return (
    <AppShell pageTitle="Flight Logs" lockViewport>
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-3">
            <h1 className="text-base font-semibold text-dash-text">Flight Logs</h1>
            <p className="text-[11px] text-dash-muted">
              LLM outputs, flight events, and live Pixhawk MAVLink messages.
            </p>
          </div>
          <ClearLogsButton label="Clear all logs" onClear={handleClearAll} />
        </div>

        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-[1.5fr_1.75fr_2.75fr]">
          <LlmOutputPanel
            entries={llmEntries}
            loading={llmLoading}
            error={llmError}
            onClear={async () => {
              await clearLlmLogs();
              reloadLlmLogs();
            }}
          />
          <FlightEventsPanel
            entries={flightEntries}
            connected={connected}
            error={error}
            onClear={async () => {
              await clearDroneLogs("flight");
              reloadDroneLogs();
            }}
          />
          <PixhawkLogsPanel
            entries={mavlinkEntries}
            connected={connected}
            onClear={async () => {
              await clearDroneLogs("mavlink");
              reloadDroneLogs();
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
