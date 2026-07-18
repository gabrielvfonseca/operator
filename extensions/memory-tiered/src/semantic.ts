import type { Embedder } from "./embedding.js";
// Qdrant-backed semantic memory client for embedded long-term facts.
import type { MemorySubsystemConfig } from "./types.js";

export type SemanticChunk = {
  id?: string;
  agentId: string;
  sourceType: string;
  sourcePath?: string;
  text: string;
  metadata?: Record<string, unknown>;
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
  upsertChunk(chunk: Omit<SemanticChunk, "id">): Promise<string>;
  deleteChunk(id: string): Promise<void>;
  query(
    q: SemanticQuery,
  ): Promise<
    Array<{ id: string; score: number; text: string; metadata?: Record<string, unknown> }>
  >;
};

export function createSemanticClient(
  config: MemorySubsystemConfig["semantic"],
  embedder: Embedder,
): SemanticClient {
  let qdrant: {
    upsert: (params: {
      collectionName: string;
      points: Array<{ id: string; vector: number[]; payload?: Record<string, unknown> }>;
    }) => Promise<void>;
    search: (params: {
      collectionName: string;
      vector: number[];
      limit: number;
      scoreThreshold?: number;
      filter?: { must: Array<{ key: string; match: { value: string } }> };
    }) => Promise<Array<{ id: string | number; score: number; payload?: Record<string, unknown> }>>;
    delete: (params: { collectionName: string; points: Array<string | number> }) => Promise<void>;
  } | null = null;

  async function ensureQdrant() {
    if (qdrant) return qdrant;
    try {
      const mod: any = await import("qdrant-client");
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
      const embedding = await embedder.embed(chunk.text);
      const id = `${chunk.agentId}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
      await q.upsert({
        collectionName: config.collection ?? "semantic_memory",
        points: [
          {
            id,
            vector: embedding,
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
      const vector =
        qParams.queryEmbedding ??
        (qParams.queryText ? await embedder.embed(qParams.queryText) : undefined);
      if (!vector) return [];
      const filter = qParams.agentId
        ? { must: [{ key: "agentId", match: { value: qParams.agentId } }] }
        : undefined;
      const res = await q.search({
        collectionName: config.collection ?? "semantic_memory",
        vector,
        limit: qParams.limit ?? 20,
        scoreThreshold: qParams.scoreThreshold,
        filter: filter as never,
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
