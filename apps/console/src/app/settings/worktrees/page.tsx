"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Worktrees",
  description: "Git worktrees managed by the gateway.",
  method: "worktrees.list",
  dataPath: "worktrees",
  columns: [
    { key: "id", label: "ID" },
    { key: "path", label: "Path" },
    { key: "branch", label: "Branch" },
  ],
  emptyTitle: "No worktrees.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
