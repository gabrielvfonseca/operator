"use client";

import { PageHeader, LoadingState, ErrorState } from "@/components/page.tsx";
import { useGatewayRequest } from "@/lib/gateway-client.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@operator/design-system";

export default function UsagePage() {
  const cost = useGatewayRequest<{ totalCost?: number; currency?: string; byProvider?: Record<string, number> }>(
    "usage.cost",
  );
  const status = useGatewayRequest<{ healthy?: boolean; models?: number }>("usage.status");

  return (
    <div>
      <PageHeader title="Usage" description="Token and cost usage across providers." />
      {cost.loading || status.loading ? <LoadingState /> : null}
      {cost.error ? <ErrorState message={cost.error} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total cost</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {cost.data?.totalCost != null
              ? `${cost.data.currency ?? "$"}${cost.data.totalCost.toFixed(2)}`
              : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {status.data ? (
              <span className={status.data.healthy ? "text-primary" : "text-destructive"}>
                {status.data.healthy ? "Healthy" : "Degraded"}
              </span>
            ) : status.error ? (
              <span className="text-destructive">{status.error}</span>
            ) : (
              "—"
            )}
          </CardContent>
        </Card>
      </div>
      {cost.data?.byProvider && Object.keys(cost.data.byProvider).length > 0 ? (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">By provider</h2>
          <ul className="flex flex-col gap-1">
            {Object.entries(cost.data.byProvider).map(([provider, amount]) => (
              <li
                key={provider}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <span>{provider}</span>
                <span className="font-medium">
                  {cost.data?.currency ?? "$"}
                  {amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
