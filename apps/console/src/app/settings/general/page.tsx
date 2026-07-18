"use client";

import { PageHeader, LoadingState, ErrorState } from "@/components/page.tsx";
import { useGatewayRequest } from "@/lib/gateway-client.tsx";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@operator/design-system";

export default function GeneralSettingsPage() {
  const { data, error, loading } = useGatewayRequest<Record<string, unknown>>("config.get", {
    scope: "general",
  });
  const schema = useGatewayRequest<{ fields?: { key: string; label: string; type: string }[] }>(
    "config.schema",
    { scope: "general" },
  );

  return (
    <div>
      <PageHeader
        title="General"
        description="Core gateway settings. Edits are validated against the config schema."
      />
      {loading || schema.loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {schema.data?.fields && schema.data.fields.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {schema.data.fields.map((field) => (
                <li key={field.key} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{field.label}</span>
                  <span className="font-medium">
                    {data && field.key in data ? String(data[field.key]) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No configurable fields.</p>
          )}
          <div className="pt-2">
            <Button variant="outline" size="sm">
              Edit configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
