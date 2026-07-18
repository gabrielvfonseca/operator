"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Workboard",
  description: "Active work items and their progress.",
  method: "sessions.search",
  dataPath: "items",
  columns: [
    { key: "id", label: "ID" },
    { key: "title", label: "Title" },
    { key: "state", label: "State" },
  ],
  emptyTitle: "Workboard is empty.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
