// Ambient module shims for optional backend drivers. These are loaded via
// dynamic import() inside try/catch and only required when the corresponding
// tiered backend is enabled, so they are declared here for type resolution
// without forcing an install of every driver in every environment.
declare module "redis" {
  export function createClient(opts: { url?: string }): {
    connect(): Promise<void>;
    get(key: string): Promise<string | null>;
    setEx(key: string, seconds: number, value: string): Promise<unknown>;
    del(key: string): Promise<unknown>;
    keys(pattern: string): Promise<string[]>;
    exists(key: string): Promise<number>;
    ttl(key: string): Promise<number>;
  };
}

declare module "qdrant-client" {
  export class QdrantClient {
    constructor(opts: { url?: string });
    getCollections(): Promise<unknown>;
    upsert(params: {
      collectionName: string;
      points: Array<{ id: string; vector: number[]; payload?: Record<string, unknown> }>;
    }): Promise<unknown>;
    search(params: {
      collectionName: string;
      vector: number[];
      limit: number;
      scoreThreshold?: number;
      filter?: unknown;
    }): Promise<Array<{ id: string | number; score: number; payload?: Record<string, unknown> }>>;
    delete(params: { collectionName: string; points: Array<string | number> }): Promise<unknown>;
  }
}

declare module "neo4j-driver" {
  export function driver(
    url: string,
    auth: unknown,
  ): {
    session(): {
      run(query: string): Promise<unknown>;
      run(
        query: string,
        params: Record<string, unknown>,
      ): Promise<{ records: Array<{ toObject(): Record<string, unknown> }> }>;
    };
  };
  export const auth: { basic(user: string, pass: string): unknown };
}

declare module "@temporalio/client" {
  export class TemporalClient {
    constructor(opts: { address?: string; namespace?: string });
    connect(): Promise<void>;
    start(params: {
      workflowId: string;
      taskQueue: string;
      args: unknown[];
    }): Promise<{ runId: string }>;
  }
}
