"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Skill Workshop",
  description: "Draft and test skills before publishing.",
  method: "skills.proposals.list",
  dataPath: "proposals",
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
  ],
  emptyTitle: "No skill proposals.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
