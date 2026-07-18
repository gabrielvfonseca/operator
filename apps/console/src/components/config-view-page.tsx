"use client";

import * as React from "react";
import { PageHeader, LoadingState, ErrorState } from "@/components/page.tsx";
import { useGatewayRequest } from "@/lib/gateway-client.tsx";
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@operator/design-system";

export type ConfigViewConfig = {
  title: string;
  description?: string;
  scope: string;
  /** Keys to surface; omit to show all top-level keys. */
  keys?: string[];
};

function valueToString(value: unknown): string {
  if (value == null) {
    return "—";
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function ConfigViewPage({ config }: { config: ConfigViewConfig }) {
  const { data, error, loading } = useGatewayRequest<Record<string, unknown>>("config.get", {
    scope: config.scope,
  });

  const entries = React.useMemo<[string, unknown][]>(() => {
    if (!data || typeof data !== "object") {
      return [];
    }
    const all = Object.entries(data);
    return config.keys ? all.filter(([key]) => config.keys!.includes(key)) : all;
  }, [data, config.keys]);

  return (
    <div>
      <PageHeader title={config.title} description={config.description} />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && entries.length > 0 ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">{key}</span>
                <span className="break-all text-right font-medium">{valueToString(value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {!loading && !error && entries.length === 0 ? (
        <EmptyState title={`No ${config.title.toLowerCase()} configured.`} />
      ) : null}
    </div>
  );
}
