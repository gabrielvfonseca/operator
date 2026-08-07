"use client";

import { PageHeader } from "@/components/page.tsx";

export default function MemoryImportPage() {
  return (
    <div>
      <PageHeader title="Memory Import" description="Import memory from a file or paste." />
      <div className="bg-card text-card-foreground border border-border rounded-lg p-6 max-w-2xl">
        <div>
          <h3 className="text-lg font-medium mb-4">Import</h3>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="memory" className="text-sm font-medium text-foreground mb-1 block">
              Memory content
            </label>
            <textarea id="memory" rows={8} placeholder="Paste memory entries here…" className="border border-input rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input" />
          </div>
          <div className="flex items-center gap-2">
            <button className="border border-input px-3 py-2 text-sm font-medium rounded hover:bg-primary/10 text-primary hover:text-primary-foreground">
              Choose file
            </button>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90">
              Import memory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
