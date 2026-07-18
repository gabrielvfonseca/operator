"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Model Providers",
  description: "Configured model providers and authentication status.",
  method: "models.list",
  dataPath: "providers",
  columns: [
    { key: "id", label: "Provider" },
    { key: "models", label: "Models" },
    { key: "auth", label: "Auth" },
  ],
  renderCell: (row, column) => {
    if (column.key === "models" && Array.isArray(row.models)) {
      return String((row.models as unknown[]).length);
    }
    if (column.key === "auth") {
      return String(row.authStatus ?? row.auth ?? "—");
    }
    return String(row[column.key] ?? "—");
  },
  emptyTitle: "No model providers configured.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
