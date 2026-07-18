// Core-owned four-tier memory subsystem config.
export type MemoryWorkingConfig = {
  redisUrl?: string;
  keyPrefix?: string;
  defaultTtlSeconds?: number;
};

export type MemoryEpisodicConfig = {
  postgresUrl?: string;
  lokiUrl?: string;
};

export type MemorySemanticConfig = {
  qdrantUrl?: string;
  collection?: string;
  embeddingProvider?: string;
  embeddingModel?: string;
};

export type MemoryProceduralConfig = {
  neo4jUrl?: string;
  temporalNamespace?: string;
  temporalHost?: string;
  temporalPort?: number;
};

export type MemoryObservabilityConfig = {
  prometheusPushUrl?: string;
  lokiUrl?: string;
  grafanaDashboardDir?: string;
};

export type MemoryNatsConfig = {
  url?: string;
  jetStreamPrefix?: string;
};

export type MemorySubsystemConfig = {
  enabled: boolean;
  working: MemoryWorkingConfig;
  episodic: MemoryEpisodicConfig;
  semantic: MemorySemanticConfig;
  procedural: MemoryProceduralConfig;
  observability: MemoryObservabilityConfig;
  nats: MemoryNatsConfig;
};

export const DEFAULT_MEMORY_SUBSYSTEM_CONFIG: MemorySubsystemConfig = {
  enabled: true,
  working: {
    redisUrl: "redis://localhost:6379",
    keyPrefix: "memory:working:",
    defaultTtlSeconds: 3600,
  },
  episodic: {
    postgresUrl: "postgres://localhost:5432/operator",
    lokiUrl: "http://localhost:3100",
  },
  semantic: {
    qdrantUrl: "http://localhost:6333",
    collection: "semantic_memory",
    embeddingProvider: "openai",
    embeddingModel: "text-embedding-3-small",
  },
  procedural: {
    neo4jUrl: "bolt://localhost:7687",
    temporalNamespace: "default",
    temporalHost: "localhost",
    temporalPort: 7233,
  },
  observability: {
    prometheusPushUrl: "http://localhost:9091",
    lokiUrl: "http://localhost:3100",
    grafanaDashboardDir: "./observability/grafana",
  },
  nats: {
    url: "nats://localhost:4222",
    jetStreamPrefix: "MEMORY",
  },
};
