"use client";

import * as React from "react";
import { PageHeader, LoadingState, ErrorState } from "@/components/page.tsx";
import { useGatewayRequest, GatewayError } from "@/lib/gateway-client.tsx";
import { EmptyState } from "@operator/design-system";

export type ResourceColumn = {
  key: string;
  label: string;
};

export type ResourcePageConfig = {
  title: string;
  description?: string;
  /** Gateway protocol method that returns the resource list. */
  method: string;
  /** Path into the response payload that holds the array to render. */
  dataPath?: string;
  /** Fallback: treat the whole payload as the array. */
  payloadIsArray?: boolean;
  columns: ResourceColumn[];
  /** Optional id field used as React key; defaults to "id". */
  idKey?: string;
  /** Render a single cell value. */
  renderCell?: (row: Record<string, unknown>, column: ResourceColumn) => React.ReactNode;
  /** Empty-state copy when the list is empty. */
  emptyTitle?: string;
  emptyDescription?: string;
};

function readPath(value: unknown, path?: string): unknown {
  if (!path) {
    return value;
  }
  return path
    .split(".")
    .reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), value);
}

export function ResourceListPage({ config }: { config: ResourcePageConfig }) {
  const { data, error, loading } = useGatewayRequest<unknown>(config.method);

  const rows = React.useMemo<Record<string, unknown>[]>(() => {
    if (data == null) {
      return [];
    }
    if (config.payloadIsArray) {
      return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
    }
    const resolved = readPath(data, config.dataPath);
    return Array.isArray(resolved) ? (resolved as Record<string, unknown>[]) : [];
  }, [data, config.dataPath, config.payloadIsArray]);

  const idKey = config.idKey ?? "id";

  return (
    <div>
      <PageHeader title={config.title} description={config.description} />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={formatError(error)} /> : null}
      {!loading && !error && rows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-muted-foreground">
              <tr>
                {config.columns.map((column) => (
                  <th key={column.key} className="px-3 py-2 font-medium">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={String(row[idKey] ?? index)}
                  className="border-t border-border hover:bg-muted/40"
                >
                  {config.columns.map((column) => (
                    <td key={column.key} className="px-3 py-2 align-top">
                      {config.renderCell
                        ? config.renderCell(row, column)
                        : String(row[column.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          title={config.emptyTitle ?? `No ${config.title.toLowerCase()} yet.`}
          description={config.emptyDescription}
        />
      ) : null}
    </div>
  );
}

function formatError(error: unknown): string {
  if (error instanceof GatewayError) {
    return error.message;
  }
  return error instanceof Error ? error.message : String(error);
}
