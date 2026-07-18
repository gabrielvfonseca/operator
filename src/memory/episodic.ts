// PostgreSQL + Loki-backed episodic memory for session transcripts and events.
import type { MemoryEpisodicConfig } from "./config.js";

export type EpisodicEvent = {
  agentId: string;
  sessionId: string;
  eventType: string;
  payload: unknown;
  occurredAt: Date;
};

export type EpisodicChunk = {
  eventId: string;
  chunkText: string;
  embeddingModel?: string;
  metadata?: Record<string, unknown>;
};

export type EpisodicQuery = {
  agentId?: string;
  sessionId?: string;
  eventType?: string;
  occurredAfter?: Date;
  occurredBefore?: Date;
  limit?: number;
};

export type EpisodicClient = {
  appendEvent(event: EpisodicEvent): Promise<string>;
  appendChunk(chunk: Omit<EpisodicChunk, "eventId"> & { eventId?: string }): Promise<string>;
  queryEvents(q: EpisodicQuery): Promise<EpisodicEvent[]>;
  queryChunks(
    q: EpisodicQuery & { queryText?: string },
  ): Promise<(EpisodicChunk & { eventId: string })[]>;
};

export function createEpisodicClient(config: MemoryEpisodicConfig): EpisodicClient {
  let pg: {
    query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
  } | null = null;

  async function ensurePg() {
    if (pg) return pg;
    try {
      // @ts-ignore external module
      const { Client } = await import("pg");
      const client = new Client({ connectionString: config.postgresUrl });
      await client.connect();
      pg = client;
      return pg;
    } catch {
      return null;
    }
  }

  async function emitLokiLog(line: string) {
    if (!config.lokiUrl) return;
    try {
      await fetch(`${config.lokiUrl}/loki/api/v1/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streams: [{ stream: { subsystem: "episodic" }, values: [[String(Date.now()), line]] }],
        }),
      });
    } catch {
      // best-effort logging
    }
  }

  return {
    async appendEvent(event) {
      const db = await ensurePg();
      if (!db) throw new Error("episodic store unavailable");
      const res = await db.query(
        `INSERT INTO episodic_events (agent_id, session_id, event_type, payload_jsonb, occurred_at) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          event.agentId,
          event.sessionId,
          event.eventType,
          JSON.stringify(event.payload),
          event.occurredAt.toISOString(),
        ],
      );
      const id = String(res.rows[0]?.id ?? "");
      await emitLokiLog(
        `event ${id} type=${event.eventType} agent=${event.agentId} session=${event.sessionId}`,
      );
      return id;
    },
    async appendChunk(chunk) {
      const db = await ensurePg();
      if (!db) throw new Error("episodic store unavailable");
      const eventId = chunk.eventId ?? "";
      const res = await db.query(
        `INSERT INTO episodic_chunks (event_id, chunk_text, embedding_model, chunk_meta_jsonb) VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          eventId || null,
          chunk.chunkText,
          chunk.embeddingModel ?? null,
          JSON.stringify(chunk.metadata ?? {}),
        ],
      );
      return String(res.rows[0]?.id ?? "");
    },
    async queryEvents(q) {
      const db = await ensurePg();
      if (!db) return [];
      const clauses: string[] = [];
      const params: unknown[] = [];
      if (q.agentId) {
        clauses.push(`agent_id = $${params.length + 1}`);
        params.push(q.agentId);
      }
      if (q.sessionId) {
        clauses.push(`session_id = $${params.length + 1}`);
        params.push(q.sessionId);
      }
      if (q.eventType) {
        clauses.push(`event_type = $${params.length + 1}`);
        params.push(q.eventType);
      }
      if (q.occurredAfter) {
        clauses.push(`occurred_at >= $${params.length + 1}`);
        params.push(q.occurredAfter.toISOString());
      }
      if (q.occurredBefore) {
        clauses.push(`occurred_at <= $${params.length + 1}`);
        params.push(q.occurredBefore.toISOString());
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const limit = q.limit ?? 100;
      const res = await db.query(
        `SELECT * FROM episodic_events ${where} ORDER BY occurred_at DESC LIMIT ${limit}`,
        params,
      );
      return res.rows.map((row) => ({
        agentId: String(row.agent_id),
        sessionId: String(row.session_id),
        eventType: String(row.event_type),
        payload: row.payload_jsonb,
        occurredAt: new Date(String(row.occurred_at)),
      }));
    },
    async queryChunks(q) {
      const db = await ensurePg();
      if (!db) return [];
      const clauses: string[] = [];
      const params: unknown[] = [];
      if (q.agentId) {
        clauses.push(`e.agent_id = $${params.length + 1}`);
        params.push(q.agentId);
      }
      if (q.sessionId) {
        clauses.push(`e.session_id = $${params.length + 1}`);
        params.push(q.sessionId);
      }
      if (q.eventType) {
        clauses.push(`e.event_type = $${params.length + 1}`);
        params.push(q.eventType);
      }
      if (q.occurredAfter) {
        clauses.push(`e.occurred_at >= $${params.length + 1}`);
        params.push(q.occurredAfter.toISOString());
      }
      if (q.occurredBefore) {
        clauses.push(`e.occurred_at <= $${params.length + 1}`);
        params.push(q.occurredBefore.toISOString());
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const limit = q.limit ?? 100;
      const res = await db.query(
        `SELECT c.*, e.agent_id, e.session_id FROM episodic_chunks c JOIN episodic_events e ON e.id = c.event_id ${where} ORDER BY e.occurred_at DESC LIMIT ${limit}`,
        params,
      );
      return res.rows.map((row) => ({
        eventId: String(row.event_id),
        chunkText: String(row.chunk_text),
        embeddingModel: row.embedding_model ? String(row.embedding_model) : undefined,
        metadata: row.chunk_meta_jsonb as Record<string, unknown> | undefined,
      }));
    },
  };
}
