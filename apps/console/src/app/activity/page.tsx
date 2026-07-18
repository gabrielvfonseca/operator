"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Activity",
  description: "Recent gateway activity and events.",
  method: "logbook.timeline",
  dataPath: "entries",
  columns: [
    { key: "ts", label: "Time" },
    { key: "kind", label: "Kind" },
    { key: "summary", label: "Summary" },
  ],
  renderCell: (row, column) =>
    column.key === "ts" && typeof row.ts === "number"
      ? new Date(row.ts).toLocaleString()
      : String(row[column.key] ?? "—"),
  emptyTitle: "No recent activity.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
