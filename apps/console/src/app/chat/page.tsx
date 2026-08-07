"use client";

import { PageHeader, LoadingState, ErrorState } from "@/components/page.tsx";
import { useGatewayRequest } from "@/lib/gateway-client.tsx";

export default function ChatPage() {
  const history = useGatewayRequest<{ messages?: { role: string; content: string }[] }>(
    "chat.history",
    { sessionId: null },
  );

  return (
    <div>
      <PageHeader title="Chat" description="Talk to your agents." />
      {history.loading ? <LoadingState /> : null}
      {history.error ? <ErrorState message={history.error} /> : null}
      <div className="bg-card text-card-foreground border border-border rounded-lg p-6 mx-auto flex h-[70vh] max-w-3xl flex-col">
        <div>
          <h3 className="text-lg font-medium mb-4">Conversation</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {/* Messages will be rendered here */}
        </div>
      </div>
    </div>
  );
}
