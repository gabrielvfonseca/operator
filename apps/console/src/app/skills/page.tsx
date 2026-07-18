"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Skills",
  description: "Available skills and their install/enable state.",
  method: "skills.status",
  dataPath: "skills",
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "installed", label: "Installed" },
  ],
  renderCell: (row, column) =>
    column.key === "installed" ? String(Boolean(row.installed)) : String(row[column.key] ?? "—"),
  emptyTitle: "No skills available.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
