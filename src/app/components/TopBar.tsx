"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TopBarProps = {
  total: number;
  isUpdating?: boolean;
  className?: string;
};

export function TopBar({ total, isUpdating = false, className }: TopBarProps) {
  const countLabel = React.useMemo(() => total.toString().padStart(3, "0"), [total]);

  return (
    <header
      className={cn("pixel-frame pixel-notch", className)}
      style={{
        boxShadow: "var(--shadow-soft)",
        paddingInline: "var(--s-3)",
        paddingBlock: "var(--s-3)",
        color: "var(--ink)",
      }}
    >
      <div className="flex justify-end" style={{ gap: "var(--s-3)" }}>
        <div
          className="flex flex-col items-end text-right"
          style={{
            gap: "calc(var(--s-1) * 0.75)",
            textTransform: "uppercase",
            letterSpacing: "var(--ls-wide)",
            fontSize: "var(--fs-xs)",
            color: "var(--ink-muted)",
          }}
        >
          <span style={{ fontSize: "var(--fs-xxs)", letterSpacing: "var(--ls-wide)" }}>Visible Frames</span>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: "var(--fs-counter)",
              lineHeight: 1,
              color: "var(--ink)",
            }}
          >
            {countLabel}
          </span>
          {isUpdating ? (
            <span
              className="animate-pulse"
              style={{
                fontSize: "var(--fs-xxs)",
                letterSpacing: "var(--ls-wider)",
                fontWeight: 600,
                color: "var(--accent)",
              }}
            >
              Updating
            </span>
          ) : (
            <span
              style={{
                fontSize: "var(--fs-xxs)",
                letterSpacing: "var(--ls-wider)",
                fontWeight: 600,
                color: "var(--ink-soft)",
              }}
            >
              Real-time Indexed
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
