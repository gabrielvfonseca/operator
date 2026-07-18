"use client";

import { ConfigViewPage } from "@/components/config-view-page.tsx";

export default function Page() {
  return (
    <ConfigViewPage
      title="Infrastructure"
      description="Underlying infrastructure and runtime configuration."
      scope="infrastructure"
    />
  );
}
