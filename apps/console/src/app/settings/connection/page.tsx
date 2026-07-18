"use client";

import { PageHeader, LoadingState, ErrorState } from "@/components/page.tsx";
import { useGatewayRequest } from "@/lib/gateway-client.tsx";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@operator/design-system";

export default function ConnectionPage() {
  const { data, error, loading } = useGatewayRequest<{
    mode?: string;
    host?: string;
    port?: number;
    tls?: boolean;
  }>("talk.config");

  return (
    <div>
      <PageHeader title="Connection" description="How clients reach this gateway." />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Gateway endpoint</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Row label="Mode" value={data?.mode ?? "—"} />
          <Row label="Host" value={data?.host ?? "—"} />
          <Row label="Port" value={data?.port != null ? String(data.port) : "—"} />
          <Row label="TLS" value={data?.tls ? "enabled" : "disabled"} />
          <div className="pt-2">
            <Button variant="outline" size="sm">
              Copy connection string
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
