// Embedding abstraction for semantic memory. Delegates to the configured
// provider adapter so semantic storage/search use real vectors.
import type { OperatorConfig } from "openclaw/plugin-sdk/config-contracts";
import { createLazyRuntimeModule } from "openclaw/plugin-sdk/lazy-runtime";
import type { MemoryTieredPluginConfig } from "./config.js";

const loadMemoryEmbeddingProviderModule = createLazyRuntimeModule(
  () => import("openclaw/plugin-sdk/memory-core-host-engine-embeddings"),
);

export type Embedder = {
  embed(text: string, options?: { timeoutMs?: number }): Promise<number[]>;
};

export class ProviderEmbedder implements Embedder {
  private promise: Promise<Embedder> | undefined;

  constructor(
    private readonly pluginConfig: MemoryTieredPluginConfig,
    private readonly getConfig: () => OperatorConfig | undefined,
  ) {}

  private resolve(): Promise<Embedder> {
    this.promise ??= (async () => {
      const cfg = this.getConfig();
      const semantic = this.pluginConfig.semantic ?? {};
      const provider = semantic.embeddingProvider ?? "openai";
      const model = semantic.embeddingModel ?? "text-embedding-3-small";
      const { getMemoryEmbeddingProvider } = await loadMemoryEmbeddingProviderModule();
      const adapter = cfg ? getMemoryEmbeddingProvider(provider, cfg) : undefined;
      if (!adapter) {
        throw new Error(`Memory embedding provider "${provider}" is unavailable.`);
      }
      const agentDir = "";
      const result = await adapter.create({
        config: cfg as OperatorConfig,
        agentDir,
        provider,
        fallback: "none",
        model,
      });
      if (!result.provider) {
        throw new Error(`Memory embedding provider "${provider}" failed to initialize.`);
      }
      const providerImpl = result.provider;
      return {
        async embed(text: string, options?: { timeoutMs?: number }) {
          if (!options?.timeoutMs) {
            return await providerImpl.embedQuery(text);
          }
          const controller = new AbortController();
          const timer: any = setTimeout(
            () => controller.abort(new Error("memory-tiered embedding timed out")),
            Math.max(1, options.timeoutMs),
          );
          timer.unref?.();
          try {
            return await providerImpl.embedQuery(text, { signal: controller.signal });
          } finally {
            clearTimeout(timer);
          }
        },
      };
    })().catch((err: unknown) => {
      this.promise = undefined;
      throw err;
    });
    return this.promise;
  }

  async embed(text: string, options?: { timeoutMs?: number }): Promise<number[]> {
    return await (await this.resolve()).embed(text, options);
  }
}

export function createEmbedder(
  pluginConfig: MemoryTieredPluginConfig,
  getConfig: () => OperatorConfig | undefined,
): Embedder {
  return new ProviderEmbedder(pluginConfig, getConfig);
}
