"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Cron Jobs",
  description: "Scheduled automation jobs and their recent runs.",
  method: "cron.list",
  dataPath: "jobs",
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "schedule", label: "Schedule" },
    { key: "enabled", label: "Enabled" },
  ],
  renderCell: (row, column) =>
    column.key === "enabled" ? String(Boolean(row.enabled)) : String(row[column.key] ?? "—"),
  emptyTitle: "No cron jobs scheduled.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
