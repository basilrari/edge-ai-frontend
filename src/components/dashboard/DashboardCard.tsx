"use client";

import React from "react";
import clsx from "clsx";

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  bodyClassName?: string;
}

export function DashboardCard({
  title,
  children,
  className,
  headerRight,
  bodyClassName,
}: DashboardCardProps): JSX.Element {
  return (
    <section className={clsx("dashboard-panel flex min-h-0 flex-col", className)}>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-dash-border px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dash-muted">
          {title}
        </h2>
        {headerRight}
      </header>
      <div className={clsx("min-h-0 flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
