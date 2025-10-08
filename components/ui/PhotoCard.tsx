import type { ReactNode } from "react";

export default function PhotoCard({ title, meta, children }: { title: string; meta?: string; children?: ReactNode }) {
  return (
    <article className="pixel-card">
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <h3 className="pixel-title" style={{ fontSize: "14px" }}>
          {title}
        </h3>
        {meta ? (
          <p className="pixel-meta" style={{ fontSize: "12px" }}>
            {meta}
          </p>
        ) : null}
      </div>
      {children}
    </article>
  );
}
