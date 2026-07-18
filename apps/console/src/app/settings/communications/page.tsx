"use client";

import { ConfigViewPage } from "@/components/config-view-page.tsx";

export default function Page() {
  return (
    <ConfigViewPage
      title="Communications"
      description="Cross-channel messaging and notification settings."
      scope="communications"
    />
  );
}
