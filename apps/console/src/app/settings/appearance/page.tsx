"use client";

import { ConfigViewPage } from "@/components/config-view-page.tsx";

export default function Page() {
  return (
    <ConfigViewPage
      title="Appearance"
      description="Theme and display preferences."
      scope="appearance"
    />
  );
}
