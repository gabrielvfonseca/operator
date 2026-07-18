// NATS JetStream wrapper for memory activity queue and workflow signaling.
import type { MemoryNatsConfig } from "./config.js";

export type NatsPublishParams = {
  subject: string;
  payload: unknown;
};

export type NatsClient = {
  publish(params: NatsPublishParams): Promise<void>;
  subscribe(
    subject: string,
    handler: (payload: unknown) => Promise<void>,
  ): Promise<{ unsubscribe: () => Promise<void> }>;
};

export function createNatsClient(config: MemoryNatsConfig): NatsClient {
  let nc: {
    publish: (subject: string, payload: Buffer) => Promise<void>;
    subscribe: (
      subject: string,
      opts: { callback: (err: Error | null, msg: { subject: string; data: Buffer }) => void },
    ) => { unsubscribe: () => Promise<void> };
    drain: () => Promise<void>;
  } | null = null;

  async function ensureNats() {
    if (nc) return nc;
    try {
      // @ts-ignore external module
      const mod = await import("nats");
      const nats = await mod.connect({ servers: config.url ?? "nats://localhost:4222" });
      nc = nats;
      return nc;
    } catch {
      return null;
    }
  }

  return {
    async publish(params) {
      const c = await ensureNats();
      if (!c) return;
      await c.publish(
        `${config.jetStreamPrefix ?? "MEMORY"}.${params.subject}`,
        Buffer.from(JSON.stringify(params.payload)),
      );
    },
    async subscribe(subject, handler) {
      const c = await ensureNats();
      if (!c) return { unsubscribe: async () => {} };
      const sub = c.subscribe(`${config.jetStreamPrefix ?? "MEMORY"}.${subject}`, {
        callback: async (_err, msg) => {
          try {
            const payload = JSON.parse(msg.data.toString("utf-8"));
            await handler(payload);
          } catch {
            // skip malformed messages
          }
        },
      });
      return { unsubscribe: async () => sub.unsubscribe() };
    },
  };
}
