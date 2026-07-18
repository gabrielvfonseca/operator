"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Agents",
  description: "Assistant and agent configurations available on this gateway.",
  method: "agents.list",
  dataPath: "agents",
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "model", label: "Model" },
  ],
  emptyTitle: "No agents configured.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
