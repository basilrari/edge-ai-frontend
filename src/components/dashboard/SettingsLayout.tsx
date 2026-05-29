"use client";

import React from "react";
import { AppShell } from "./AppShell";
import { useTimeDisplayContext } from "./TimeDisplayProvider";
import { GATEWAY_URL } from "../../lib/gateway";
import {
  COMMON_TIMEZONES,
  timezoneModeLabel,
  type TimezoneMode,
} from "../../lib/timeDisplay";

function ModeOption({
  mode,
  current,
  title,
  description,
  onSelect,
}: {
  mode: TimezoneMode;
  current: TimezoneMode;
  title: string;
  description: string;
  onSelect: (mode: TimezoneMode) => void;
}): JSX.Element {
  const selected = current === mode;
  return (
    <label className="flex cursor-pointer gap-3 rounded-lg border border-dash-border px-3 py-2.5 transition-colors hover:border-dash-accent/40">
      <input
        type="radio"
        name="timezone-mode"
        checked={selected}
        onChange={() => onSelect(mode)}
        className="mt-0.5 accent-dash-accent"
      />
      <span>
        <span className="block text-sm font-medium text-dash-text">{title}</span>
        <span className="mt-0.5 block text-xs text-dash-muted">{description}</span>
      </span>
    </label>
  );
}

function SettingsContent(): JSX.Element {
  const {
    settings,
    setSettings,
    label,
    formatClock,
    locationAvailable,
    locationError,
  } = useTimeDisplayContext();

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div>
        <h1 className="text-base font-semibold text-dash-text">Settings</h1>
        <p className="text-[11px] text-dash-muted">
          Operator preferences and connection details.
        </p>
      </div>

      <section className="dashboard-panel p-4">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-dash-muted">
          Connection
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-dash-muted">Gateway</dt>
            <dd className="font-mono text-dash-text">{GATEWAY_URL}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-dash-muted">Camera</dt>
            <dd className="font-mono text-dash-text">{GATEWAY_URL}/camera/stream</dd>
          </div>
        </dl>
      </section>

      <section className="dashboard-panel p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dash-muted">
              Time display
            </h2>
            <p className="mt-1 text-xs text-dash-muted">
              Controls the clock in the navbar and timestamps in flight logs.
            </p>
          </div>
          <div className="rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wider text-dash-muted">
              Preview
            </p>
            <p className="font-mono text-sm text-dash-text">
              {label} {formatClock()}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <ModeOption
            mode="utc"
            current={settings.mode}
            title={timezoneModeLabel("utc")}
            description="Always show coordinated universal time (GMT+0)."
            onSelect={(mode) => setSettings({ ...settings, mode })}
          />
          <ModeOption
            mode="auto"
            current={settings.mode}
            title={timezoneModeLabel("auto")}
            description="Use your browser or device timezone."
            onSelect={(mode) => setSettings({ ...settings, mode })}
          />
          <ModeOption
            mode="location"
            current={settings.mode}
            title={timezoneModeLabel("location")}
            description={
              locationAvailable
                ? "Estimate timezone from operator GPS (longitude-based)."
                : locationError
                  ? `Location unavailable: ${locationError}. Falls back to browser timezone.`
                  : "Waiting for location permission…"
            }
            onSelect={(mode) => setSettings({ ...settings, mode })}
          />
        </div>

        <div className="mt-4 border-t border-dash-border pt-4">
          <label className="block text-xs font-medium text-dash-text">
            Custom timezone
          </label>
          <p className="mt-1 text-[11px] text-dash-muted">
            Pick a specific IANA zone (shown as GMT offset in the navbar).
          </p>
          <select
            value={settings.customTimeZone}
            onChange={(e) =>
              setSettings({
                mode: "custom",
                customTimeZone: e.target.value,
              })
            }
            className="mt-2 w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text"
          >
            {COMMON_TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          {settings.mode === "custom" ? (
            <p className="mt-2 text-[11px] text-dash-muted">
              Active: {timezoneModeLabel("custom")} — {settings.customTimeZone}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function SettingsLayout(): JSX.Element {
  return (
    <AppShell pageTitle="Settings">
      <SettingsContent />
    </AppShell>
  );
}
