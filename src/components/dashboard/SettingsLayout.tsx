"use client";

import React from "react";
import { AppShell } from "./AppShell";
import { GATEWAY_URL } from "../../lib/gateway";

export function SettingsLayout(): JSX.Element {
  return (
    <AppShell pageTitle="Settings">
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
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-dash-muted">
            Display
          </h2>
          <p className="text-xs text-dash-muted">
            Theme and layout options will appear here in a future update.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
