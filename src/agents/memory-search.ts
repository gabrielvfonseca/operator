/**
 * Resolves memory-search configuration for the new four-tier memory subsystem.
 */
import type { OperatorConfig } from "../config/config.js";
import type { SecretInput } from "../config/types.secrets.js";
import { clampInt, clampNumber } from "../utils.js";

export type ResolvedMemorySearchConfig = {
  enabled: boolean;
  sources: Array<"memory" | "sessions">;
  extraPaths: string[];
  provider: string;
  remote?: {
    baseUrl?: string;
    apiKey?: SecretInput;
    headers?: Record<string, string>;
    nonBatchConcurrency?: number;
    batch?: {
      enabled: boolean;
      wait: boolean;
      concurrency: number;
      pollIntervalMs: number;
      timeoutMinutes: number;
    };
  };
  experimental: {
    sessionMemory: boolean;
  };
  fallback: string;
  model: string;
  inputType?: string;
  queryInputType?: string;
  documentInputType?: string;
  outputDimensionality?: number;
  local: {
    modelPath?: string;
    modelCacheDir?: string;
    contextSize?: number | "auto";
  };
  store: {
    driver: "qdrant" | "postgres" | "sqlite";
    qdrantUrl?: string;
    postgresUrl?: string;
    databasePath?: string;
    fts: {
      tokenizer: "unicode61" | "trigram";
    };
    vector: {
      enabled: boolean;
    };
  };
  chunking: {
    tokens: number;
    overlap: number;
  };
  sync: {
    onSessionStart: boolean;
    onSearch: boolean;
    watch: boolean;
  };
  citationsMode: "off" | "compact" | "full";
};

export function resolveMemorySearchConfig(params: {
  config: OperatorConfig;
  agentId?: string;
}): ResolvedMemorySearchConfig {
  const cfg = params.config;
  const memorySearch = cfg.agents?.defaults?.memorySearch;
  const provider = memorySearch?.provider ?? "openai";
  const model = memorySearch?.model ?? "text-embedding-3-small";
  const chunking = memorySearch?.chunking ?? { tokens: 400, overlap: 80 };
  const store = memorySearch?.store ?? { driver: "qdrant" as const, fts: { tokenizer: "unicode61" as const }, vector: { enabled: true } };
  return {
    enabled: true,
    sources: ["memory", "sessions"],
    extraPaths: Array.isArray(memorySearch?.extraPaths) ? memorySearch.extraPaths.map(String) : [],
    provider,
    remote: memorySearch?.remote,
    experimental: {
      sessionMemory: memorySearch?.experimental?.sessionMemory ?? false,
    },
    fallback: memorySearch?.fallback ?? "none",
    model,
    inputType: memorySearch?.inputType,
    queryInputType: memorySearch?.queryInputType,
    documentInputType: memorySearch?.documentInputType,
    outputDimensionality: memorySearch?.outputDimensionality,
    local: {
      modelPath: memorySearch?.local?.modelPath,
      modelCacheDir: memorySearch?.local?.modelCacheDir,
      contextSize: memorySearch?.local?.contextSize,
    },
    store: {
      driver: store.driver === "sqlite" ? "qdrant" : store.driver,
      qdrantUrl: store.driver === "qdrant" ? "http://localhost:6333" : undefined,
      postgresUrl: store.driver === "postgres" ? "postgres://localhost:5432/operator" : undefined,
      databasePath: store.driver === "sqlite" ? undefined : store.databasePath,
      fts: store.fts,
      vector: store.vector,
    },
    chunking: {
      tokens: clampInt(chunking.tokens ?? 400, { min: 50, max: 4000 }),
      overlap: clampInt(chunking.overlap ?? 80, { min: 0, max: 500 }),
    },
    sync: {
      onSessionStart: memorySearch?.sync?.onSessionStart ?? true,
      onSearch: memorySearch?.sync?.onSearch ?? true,
      watch: memorySearch?.sync?.watch ?? true,
    },
    citationsMode: memorySearch?.citationsMode ?? "off",
  };
}
