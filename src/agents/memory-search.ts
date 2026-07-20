/**
 * Resolves memory-search configuration for the new four-tier memory subsystem.
 */
import type { MemorySearchConfig } from "../config/types.tools.js";
import type { OperatorConfig } from "../config/config.js";
import { clampInt } from "../utils.js";

type ResolvedStore = {
  driver: "qdrant" | "postgres" | "sqlite";
  qdrantUrl?: string;
  postgresUrl?: string;
  databasePath?: string;
  fts: { tokenizer: "unicode61" | "trigram" };
  vector: { enabled: boolean };
};

export type ResolvedMemorySearchConfig = {
  enabled: boolean;
  sources: Array<"memory" | "sessions">;
  extraPaths: string[];
  provider: string;
  remote?: MemorySearchConfig["remote"];
  experimental: { sessionMemory: boolean };
  fallback: string;
  model: string;
  inputType?: string;
  queryInputType?: string;
  documentInputType?: string;
  outputDimensionality?: number;
  local: MemorySearchConfig["local"];
  store: ResolvedStore;
  chunking: {
    tokens: number;
    overlap: number;
  };
  sync: {
    onSessionStart: boolean;
    onSearch: boolean;
    watch: boolean;
    sessions: {
      deltaBytes?: number;
      deltaMessages?: number;
      postCompactionForce?: boolean;
    };
  };
  citationsMode: "off" | "compact" | "full";
};

export function resolveMemorySearchConfig(
  cfg: OperatorConfig,
  _agentId?: string,
): ResolvedMemorySearchConfig {
  const memorySearch = cfg.agents?.defaults?.memorySearch;
  const provider = memorySearch?.provider ?? "openai";
  const model = memorySearch?.model ?? "text-embedding-3-small";
  const chunking = memorySearch?.chunking ?? { tokens: 400, overlap: 80 };
  const rawStore = memorySearch?.store ?? {
    driver: "qdrant" as const,
    fts: { tokenizer: "unicode61" as const },
    vector: { enabled: true },
  };
  const driver = rawStore.driver === "sqlite" ? "qdrant" : (rawStore.driver ?? "qdrant");
  const resolvedStore: ResolvedStore = {
    driver,
    qdrantUrl: driver === "qdrant" ? "http://localhost:6333" : undefined,
    postgresUrl: driver === "postgres" ? "postgres://localhost:5432/operator" : undefined,
    databasePath: rawStore.databasePath,
    fts: { tokenizer: rawStore.fts?.tokenizer ?? "unicode61" },
    vector: { enabled: rawStore.vector?.enabled ?? true },
  };
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
    store: resolvedStore,
    chunking: {
      tokens: clampInt(chunking.tokens ?? 400, 50, 4000),
      overlap: clampInt(chunking.overlap ?? 80, 0, 500),
    },
    sync: {
      onSessionStart: memorySearch?.sync?.onSessionStart ?? true,
      onSearch: memorySearch?.sync?.onSearch ?? true,
      watch: memorySearch?.sync?.watch ?? true,
      sessions: memorySearch?.sync?.sessions ?? {},
    },
    citationsMode: memorySearch?.citationsMode ?? "off",
  };
}
