"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Tasks",
  description: "Background and scheduled tasks.",
  method: "taskSuggestions.list",
  dataPath: "tasks",
  columns: [
    { key: "id", label: "ID" },
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
  ],
  emptyTitle: "No tasks.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
