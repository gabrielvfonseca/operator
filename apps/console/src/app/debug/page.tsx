"use client";

import { PageHeader, LoadingState, ErrorState } from "@/components/page.tsx";
import { useGatewayRequest } from "@/lib/gateway-client.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@operator/design-system";

export default function DebugPage() {
  const { data, error, loading } = useGatewayRequest<Record<string, unknown>>("logbook.status");

  return (
    <div>
      <PageHeader title="Debug" description="Gateway diagnostics and runtime state." />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
            {data ? JSON.stringify(data, null, 2) : "—"}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
