// Local memory subsystem config types (mirrors core MemorySubsystemConfig
// without depending on core internals, per the extension boundary rule).
export type MemoryWorkingConfig = {
  redisUrl?: string;
  keyPrefix?: string;
  defaultTtlSeconds?: number;
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

export type MemorySubsystemConfig = {
  enabled: boolean;
  working: MemoryWorkingConfig;
  semantic: MemorySemanticConfig;
  procedural: MemoryProceduralConfig;
};
