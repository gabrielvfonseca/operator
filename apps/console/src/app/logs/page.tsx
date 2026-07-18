"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Logs",
  description: "Gateway and agent log streams.",
  method: "logbook.days",
  dataPath: "days",
  columns: [
    { key: "date", label: "Date" },
    { key: "count", label: "Entries" },
  ],
  emptyTitle: "No logs available.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
