"use client";

import { PageHeader, LoadingState, ErrorState } from "@/components/page.tsx";
import { useGatewayRequest } from "@/lib/gateway-client.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@operator/design-system";

export default function PluginPage() {
  const { data, error, loading } = useGatewayRequest<{ id?: string; name?: string; version?: string }>(
    "plugins.search",
    { query: "" },
  );

  return (
    <div>
      <PageHeader title="Plugin" description="Browse and install gateway plugins." />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Plugin catalog</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {data ? JSON.stringify(data, null, 2) : "Search the plugin catalog to get started."}
        </CardContent>
      </Card>
    </div>
  );
}
