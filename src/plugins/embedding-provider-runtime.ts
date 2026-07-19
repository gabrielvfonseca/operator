/** Runtime resolver for plugin-contributed embedding providers. */
import type { OperatorConfig } from "../config/types.operator.js";
import { resolveConfiguredGenericEmbeddingProviderId } from "./embedding-provider-config.js";
import {
  getRuntimeEmbeddingProviderAdapter,
  listRuntimeEmbeddingProviderAdapters,
  resolveRuntimeEmbeddingProviderLookupIds,
} from "./embedding-provider-runtime-shared.js";
import {
  getRegisteredEmbeddingProvider,
  listRegisteredEmbeddingProviders,
  type EmbeddingProviderAdapter,
} from "./embedding-providers.js";

/** Lists embedding provider adapters registered directly with the process registry. */
function listRegisteredEmbeddingProviderAdapters(): EmbeddingProviderAdapter[] {
  return listRegisteredEmbeddingProviders().map((entry) => entry.adapter);
}

/** Lists embedding providers from registered adapters and plugin capabilities. */
export function listEmbeddingProviders(cfg?: OperatorConfig): EmbeddingProviderAdapter[] {
  return listRuntimeEmbeddingProviderAdapters({
    key: "embeddingProviders",
    cfg,
    registered: listRegisteredEmbeddingProviderAdapters(),
  });
}

function resolveConfiguredEmbeddingProviderId(
  providerId: string,
  cfg?: OperatorConfig,
): string | undefined {
  return resolveConfiguredGenericEmbeddingProviderId(providerId, cfg);
}

function resolveEmbeddingProviderLookupIds(id: string, cfg?: OperatorConfig): string[] {
  return resolveRuntimeEmbeddingProviderLookupIds({
    id,
    cfg,
    resolveConfiguredProviderId: resolveConfiguredEmbeddingProviderId,
  });
}

/** Resolves one embedding provider adapter by id, including configured API aliases. */
export function getEmbeddingProvider(
  id: string,
  cfg?: OperatorConfig,
): EmbeddingProviderAdapter | undefined {
  return getRuntimeEmbeddingProviderAdapter({
    key: "embeddingProviders",
    cfg,
    lookupIds: resolveEmbeddingProviderLookupIds(id, cfg),
    getRegisteredProvider: getRegisteredEmbeddingProvider,
  });
}

export type { EmbeddingProvider, EmbeddingProviderAdapter } from "./embedding-providers.js";
