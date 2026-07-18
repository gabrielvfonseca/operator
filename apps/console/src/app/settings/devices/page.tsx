"use client";

import { ResourceListPage, type ResourcePageConfig } from "@/components/resource-list-page.tsx";

const config: ResourcePageConfig = {
  title: "Nodes",
  description: "Paired devices and remote gateway nodes.",
  method: "node.list",
  dataPath: "nodes",
  columns: [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
  ],
  emptyTitle: "No nodes paired.",
};

export default function Page() {
  return <ResourceListPage config={config} />;
}
