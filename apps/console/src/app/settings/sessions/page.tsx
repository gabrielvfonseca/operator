"use client";

import { PageHeader, LoadingState, ErrorState } from "@/components/page.tsx";
import { useGatewayRequest } from "@/lib/gateway-client.tsx";

interface SessionEntry {
  id: string;
  title?: string;
  agentId?: string;
  updatedAt?: number;
}

export default function SessionsPage() {
  const { data, error, loading } = useGatewayRequest<{ sessions?: SessionEntry[] }>(
    "sessions.catalog.list",
  );

  return (
    <div>
      <PageHeader
        title="Sessions"
        description="Conversation and agent-run history stored on this gateway."
      />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {data?.sessions && data.sessions.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {data.sessions.map((session) => (
            <li
              key={session.id}
              className="rounded-md border border-border bg-card p-3 text-sm"
            >
              <div className="font-medium">{session.title ?? session.id}</div>
              <div className="text-xs text-muted-foreground">
                {session.agentId ?? "agent"} · {session.id}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {data && (!data.sessions || data.sessions.length === 0) && !loading && !error ? (
        <p className="text-sm text-muted-foreground">No sessions yet.</p>
      ) : null}
    </div>
  );
}
