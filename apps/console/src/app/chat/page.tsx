"use client";

import { PageHeader, LoadingState, ErrorState } from "@/components/page.tsx";
import { useGatewayRequest } from "@/lib/gateway-client.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@operator/design-system";

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
      <Card className="mx-auto flex h-[70vh] max-w-3xl flex-col">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto text-sm">
          {history.data?.messages && history.data.messages.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {history.data.messages.map((message, index) => (
                <li
                  key={index}
                  className={
                    "rounded-md border border-border p-3 " +
                    (message.role === "user" ? "bg-accent/40" : "bg-card")
                  }
                >
                  <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    {message.role}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No messages yet. Start a conversation.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
