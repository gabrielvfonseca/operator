"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Plugins",
  description: "Installed gateway plugins and their enabled state.",
  method: "plugins.list",
  dataPath: "plugins",
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "enabled", label: "Enabled" },
  ],
  renderCell: (row, column) =>
    column.key === "enabled" ? String(Boolean(row.enabled)) : String(row[column.key] ?? "—"),
  emptyTitle: "No plugins installed.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
