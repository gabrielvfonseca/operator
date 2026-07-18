"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Channels",
  description: "Connected messaging channels and their connection state.",
  method: "channels.status",
  dataPath: "channels",
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
  ],
  emptyTitle: "No channels connected.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
