// Qdrant-backed semantic memory for embedded concepts and long-term facts.
import type { MemorySemanticConfig } from "./config.js";

export type SemanticChunk = {
  id?: string;
  agentId: string;
  sourceType: string;
  sourcePath?: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  createdAt?: Date;
};

export type SemanticQuery = {
  agentId?: string;
  queryText?: string;
  queryEmbedding?: number[];
  sourceType?: string;
  limit?: number;
  scoreThreshold?: number;
};

export type SemanticClient = {
  upsertChunk(chunk: Omit<SemanticChunk, "id" | "createdAt">): Promise<string>;
  deleteChunk(id: string): Promise<void>;
  query(
    q: SemanticQuery,
  ): Promise<
    Array<{ id: string; score: number; text: string; metadata?: Record<string, unknown> }>
  >;
};

export function createSemanticClient(config: MemorySemanticConfig): SemanticClient {
  let qdrant: {
    upsert: (params: {
      collectionName: string;
      points: { id: string | number; vector: number[]; payload?: Record<string, unknown> }[];
    }) => Promise<void>;
    search: (params: {
      collectionName: string;
      vector: number[];
      limit: number;
      scoreThreshold?: number;
      filter?: { must: { key: string; match: { value: string } }[] };
    }) => Promise<{ id: string | number; score: number; payload?: Record<string, unknown> }[]>;
    delete: (params: { collectionName: string; points: (string | number)[] }) => Promise<void>;
  } | null = null;

  async function ensureQdrant() {
    if (qdrant) return qdrant;
    try {
      // @ts-ignore external module
      const mod = await import("qdrant-client");
      const client = new mod.QdrantClient({ url: config.qdrantUrl });
      await client.getCollections();
      qdrant = client;
      return qdrant;
    } catch {
      return null;
    }
  }

  return {
    async upsertChunk(chunk) {
      const q = await ensureQdrant();
      if (!q) throw new Error("semantic store unavailable");
      const id = `${chunk.agentId}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
      await q.upsert({
        collectionName: config.collection ?? "semantic_memory",
        points: [
          {
            id,
            vector: chunk.embedding,
            payload: {
              agentId: chunk.agentId,
              sourceType: chunk.sourceType,
              sourcePath: chunk.sourcePath ?? null,
              text: chunk.text,
              metadata: chunk.metadata ?? {},
              createdAt: new Date().toISOString(),
            },
          },
        ],
      });
      return String(id);
    },
    async deleteChunk(id) {
      const q = await ensureQdrant();
      if (!q) return;
      await q.delete({ collectionName: config.collection ?? "semantic_memory", points: [id] });
    },
    async query(qParams) {
      const q = await ensureQdrant();
      if (!q) return [];
      if (!qParams.queryEmbedding && qParams.queryText) {
        throw new Error(
          "semantic query requires queryEmbedding (embed the query text before calling query)",
        );
      }
      const filter = qParams.agentId
        ? { must: [{ key: "agentId", match: { value: qParams.agentId } }] }
        : undefined;
      const res = await q.search({
        collectionName: config.collection ?? "semantic_memory",
        vector: qParams.queryEmbedding ?? [],
        limit: qParams.limit ?? 20,
        scoreThreshold: qParams.scoreThreshold,
        filter: filter as any,
      });
      return res.map((r) => ({
        id: String(r.id),
        score: r.score,
        text: (r.payload?.text as string | undefined) ?? "",
        metadata: (r.payload?.metadata as Record<string, unknown> | undefined) ?? {},
      }));
    },
  };
}
