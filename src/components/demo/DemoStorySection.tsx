"use client";

import { useState } from "react";
import {
  RelationshipGraphPreview,
  type ImportedGraphPayload,
} from "@/components/landing/RelationshipGraphPreview";
import { StoryImportPanel } from "@/components/demo/StoryImportPanel";

export function DemoStorySection() {
  const [imported, setImported] = useState<ImportedGraphPayload | null>(null);

  return (
    <div className="space-y-6">
      <StoryImportPanel
        onImported={setImported}
        onClear={() => setImported(null)}
        hasImport={imported !== null}
      />
      {imported ? (
        <p className="text-xs text-muted">
          Showing imported graph. Episode picker is hidden until you clear the import.
        </p>
      ) : null}
      <RelationshipGraphPreview
        variant="full"
        story="singles-inferno-s5"
        importedGraph={imported}
      />
    </div>
  );
}
