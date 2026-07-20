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

type QdrantApi = {
  collections: {
    getCollections: () => Promise<{ result?: { collections: Array<{ name: string }> } }>;
  };
  points: {
    upsertPoints: (
      collectionName: string,
      data: {
        points: Array<{ id: string | number; vector: number[]; payload?: Record<string, unknown> }>;
      },
    ) => Promise<{ result?: { status: string } }>;
    searchPoints: (
      collectionName: string,
      data: {
        vector: number[];
        limit: number;
        scoreThreshold?: number;
        filter?: { must: Array<{ key: string; match: { value: string } }> };
      },
    ) => Promise<{
      result?: Array<{ id: string | number; score: number; payload?: Record<string, unknown> }>;
    }>;
    deletePoints: (
      collectionName: string,
      data: { points: Array<string | number> },
    ) => Promise<{ result?: { status: string } }>;
  };
};

export function createSemanticClient(config: MemorySemanticConfig): SemanticClient {
  let client: {
    getCollections: () => Promise<{ result?: { collections: Array<{ name: string }> } }>;
    upsertPoints: (
      collectionName: string,
      data: {
        points: Array<{ id: string | number; vector: number[]; payload?: Record<string, unknown> }>;
      },
    ) => Promise<{ result?: { status: string } }>;
    searchPoints: (
      collectionName: string,
      data: {
        vector: number[];
        limit: number;
        scoreThreshold?: number;
        filter?: { must: Array<{ key: string; match: { value: string } }> };
      },
    ) => Promise<{
      result?: Array<{ id: string | number; score: number; payload?: Record<string, unknown> }>;
    }>;
    deletePoints: (
      collectionName: string,
      data: { points: Array<string | number> },
    ) => Promise<{ result?: { status: string } }>;
  } | null = null;

  async function ensureQdrant() {
    if (client) return client;
    try {
      const mod = await import("qdrant-client");
      const httpClient = new mod.Api({ baseUrl: config.qdrantUrl }) as unknown as QdrantApi;
      await httpClient.collections.getCollections();
      client = {
        getCollections: () => httpClient.collections.getCollections(),
        upsertPoints: (collectionName, data) =>
          httpClient.points.upsertPoints(collectionName, { points: data.points }),
        searchPoints: (collectionName, data) =>
          httpClient.points.searchPoints(collectionName, data),
        deletePoints: (collectionName, data) =>
          httpClient.points.deletePoints(collectionName, { points: data.points }),
      };
      return client;
    } catch {
      return null;
    }
  }

  return {
    async upsertChunk(chunk) {
      const q = await ensureQdrant();
      if (!q) throw new Error("semantic store unavailable");
      const id = `${chunk.agentId}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
      await q.upsertPoints(config.collection ?? "semantic_memory", {
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
      await q.deletePoints(config.collection ?? "semantic_memory", { points: [id] });
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
      const res = await q.searchPoints(config.collection ?? "semantic_memory", {
        vector: qParams.queryEmbedding ?? [],
        limit: qParams.limit ?? 20,
        scoreThreshold: qParams.scoreThreshold,
        filter,
      });
      return (res.result ?? []).map((r) => ({
        id: String(r.id),
        score: r.score,
        text: (r.payload?.text as string | undefined) ?? "",
        metadata: (r.payload?.metadata as Record<string, unknown> | undefined) ?? {},
      }));
    },
  };
}
