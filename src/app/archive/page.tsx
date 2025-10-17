import { Suspense, type CSSProperties } from "react";
import Link from "next/link";

import { ArchiveExplorer } from "../components/ArchiveExplorer";

const fallbackStyle: CSSProperties = {
  paddingInline: "clamp(var(--s-2), 4vw, var(--s-4))",
  paddingBlock: "calc(var(--s-3) * 2)",
  textAlign: "center",
  color: "var(--ink-muted)",
};

export default function ArchivePage() {
  return (
    <main
      className="pixel-bg min-h-screen"
      style={{
        paddingInline: "clamp(var(--s-2), 4vw, var(--s-4))",
        paddingTop: "calc(var(--s-4) * 1.5)",
        paddingBottom: "calc(var(--s-4) * 2)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-3)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            paddingInline: "var(--s-4)",
            paddingBlock: "var(--s-3)",
            border: "2px solid #ffffff",
            borderRadius: 0,
            boxShadow: "0 0 0 6px rgba(255, 255, 255, 0.12)",
            fontFamily: "var(--font-pixel)",
            fontSize: "3rem",
            letterSpacing: "0.12em",
            textTransform: "lowercase",
          }}
        >
          digi love
        </div>
      </div>

      <nav
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Link
          href="/about"
          className="pixel-frame pixel-notch"
          style={{
            paddingInline: "var(--s-3)",
            paddingBlock: "var(--s-2)",
            fontSize: "var(--fs-sm)",
            letterSpacing: "var(--ls-wide)",
            textTransform: "uppercase",
            color: "var(--ink)",
            background: "var(--panel)",
            textDecoration: "none",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          about us
        </Link>
      </nav>

      <Suspense fallback={<div style={fallbackStyle}>Loading archive…</div>}>
        <ArchiveExplorer syncWithUrl />
      </Suspense>
    </main>
  );
}
