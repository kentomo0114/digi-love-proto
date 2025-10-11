import { Suspense } from "react";

import { ArchiveExplorer } from "../components/ArchiveExplorer";

export default function ExplorePage() {
  return (
    <Suspense fallback={<div style={{ padding: "var(--s-3)", textAlign: "center" }}>Loading archive…</div>}>
      <ArchiveExplorer syncWithUrl />
    </Suspense>
  );
}
