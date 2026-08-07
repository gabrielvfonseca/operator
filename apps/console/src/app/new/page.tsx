"use client";

import { PageHeader } from "@/components/page.tsx";

export default function NewSessionPage() {
  return (
    <div>
      <PageHeader title="New Session" description="Start a new conversation or agent run." />
      <div className="bg-card text-card-foreground border border-border rounded-lg p-6 max-w-xl">
        <div>
          <h3 className="text-lg font-medium mb-4">Session</h3>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal" className="text-sm font-medium text-foreground mb-1 block">
              Goal
            </label>
            <input id="goal" placeholder="What should the agent do?" className="border border-input rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="agent" className="text-sm font-medium text-foreground mb-1 block">
              Agent
            </label>
            <input id="agent" placeholder="default" className="border border-input rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input" />
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90">
            Create session
          </button>
        </div>
      </div>
    </div>
  );
}
