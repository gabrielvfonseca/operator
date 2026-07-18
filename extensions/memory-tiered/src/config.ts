// Memory Tiered config parsing: plugin config -> MemorySubsystemConfig.
import type { MemorySubsystemConfig } from "./types.js";

export type MemoryTieredPluginConfig = {
  enabled?: boolean;
  working: {
    redisUrl?: string;
    keyPrefix?: string;
    defaultTtlSeconds?: number;
  };
  semantic: {
    qdrantUrl?: string;
    collection?: string;
    embeddingProvider?: string;
    embeddingModel?: string;
  };
  procedural: {
    neo4jUrl?: string;
    temporalHost?: string;
    temporalPort?: number;
    temporalNamespace?: string;
  };
};

const DEFAULTS = {
  working: {
    redisUrl: "redis://localhost:6379",
    keyPrefix: "memory:working:",
    defaultTtlSeconds: 3600,
  },
  semantic: {
    qdrantUrl: "http://localhost:6333",
    collection: "semantic_memory",
    embeddingProvider: "openai",
    embeddingModel: "text-embedding-3-small",
  },
  procedural: {
    neo4jUrl: "bolt://localhost:7687",
    temporalHost: "localhost",
    temporalPort: 7233,
    temporalNamespace: "default",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function num(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export function parseMemoryTieredConfig(value: unknown): MemorySubsystemConfig {
  const cfg = isRecord(value) ? value : {};
  const working = isRecord(cfg.working) ? cfg.working : {};
  const semantic = isRecord(cfg.semantic) ? cfg.semantic : {};
  const procedural = isRecord(cfg.procedural) ? cfg.procedural : {};

  return {
    enabled: typeof cfg.enabled === "boolean" ? cfg.enabled : true,
    working: {
      redisUrl: str(working.redisUrl) ?? DEFAULTS.working.redisUrl,
      keyPrefix: str(working.keyPrefix) ?? DEFAULTS.working.keyPrefix,
      defaultTtlSeconds:
        num(working.defaultTtlSeconds, 1, 86_400_000) ?? DEFAULTS.working.defaultTtlSeconds,
    },
    semantic: {
      qdrantUrl: str(semantic.qdrantUrl) ?? DEFAULTS.semantic.qdrantUrl,
      collection: str(semantic.collection) ?? DEFAULTS.semantic.collection,
      embeddingProvider: str(semantic.embeddingProvider) ?? DEFAULTS.semantic.embeddingProvider,
      embeddingModel: str(semantic.embeddingModel) ?? DEFAULTS.semantic.embeddingModel,
    },
    procedural: {
      neo4jUrl: str(procedural.neo4jUrl) ?? DEFAULTS.procedural.neo4jUrl,
      temporalHost: str(procedural.temporalHost) ?? DEFAULTS.procedural.temporalHost,
      temporalPort: num(procedural.temporalPort, 1, 65535) ?? DEFAULTS.procedural.temporalPort,
      temporalNamespace: str(procedural.temporalNamespace) ?? DEFAULTS.procedural.temporalNamespace,
    },
  };
}
