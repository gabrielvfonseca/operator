// Memory Tiered plugin entry. Replaces the SQLite/Markdown memory-core slot
// with the real 3-tier orchestrator: working (Redis), semantic (Qdrant),
// and procedural (Neo4j + Temporal), exposed via agent tools.
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import { resolveLivePluginConfigObject } from "openclaw/plugin-sdk/plugin-config-runtime";
import {
  definePluginEntry,
  type OpenClawPluginApi,
  type OpenClawPluginToolContext,
} from "./api.js";
import { parseMemoryTieredConfig, type MemoryTieredPluginConfig } from "./src/config.js";
import { createEmbedder } from "./src/embedding.js";
import { createProceduralClient } from "./src/procedural.js";
import { createSemanticClient } from "./src/semantic.js";
import { buildMemoryTools, type MemoryToolContext } from "./src/tools.js";
import { createWorkingMemoryClient } from "./src/working.js";

export default definePluginEntry({
  id: "memory-tiered",
  name: "Memory (Tiered)",
  description: "Real tiered memory: working, semantic, and procedural stores via agent tools.",
  register(api: OpenClawPluginApi) {
    const readCurrentConfig = (): OpenClawConfig | undefined => {
      try {
        return (
          (api.runtime.config?.current?.() as OpenClawConfig | undefined) ??
          (api.config as OpenClawConfig | undefined)
        );
      } catch {
        return api.config as OpenClawConfig | undefined;
      }
    };

    let pluginConfig: MemoryTieredPluginConfig = parseMemoryTieredConfig(api.pluginConfig);
    const refreshLiveConfig = () => {
      const live = resolveLivePluginConfigObject(
        api.runtime.config?.current
          ? () => api.runtime.config.current() as OpenClawConfig
          : undefined,
        "memory-tiered",
        api.pluginConfig as Record<string, unknown>,
      );
      if (live) pluginConfig = parseMemoryTieredConfig(live);
    };

    const embedder = createEmbedder(pluginConfig, readCurrentConfig);

    const buildContext = (ctx: OpenClawPluginToolContext): MemoryToolContext => {
      refreshLiveConfig();
      const agentId = ctx.agentId ?? "main";
      return {
        agentId,
        ...(ctx.sessionId ? { sessionId: ctx.sessionId } : {}),
        working: createWorkingMemoryClient(pluginConfig.working),
        semantic: createSemanticClient(pluginConfig.semantic, embedder),
        procedural: createProceduralClient(pluginConfig.procedural),
      };
    };

    const toolFactories = buildMemoryTools;
    api.registerTool((ctx) => toolFactories(buildContext(ctx)) as never);

    api.registerCommand({
      name: "memory",
      description: "Tiered memory management (migrate legacy Markdown into semantic memory).",
      acceptsArgs: true,
      handler: async (ctx) => {
        const tokens = (ctx.args ?? "").trim().split(/\s+/).filter(Boolean);
        const sub = tokens[0]?.toLowerCase();
        if (sub !== "migrate") {
          return {
            text: "Usage:\n  /memory migrate   Migrate MEMORY.md + memory/*.md into semantic memory",
          };
        }
        try {
          const { migrateMarkdownToSemantic } = await import("./src/migrate.js");
          const outcome = await migrateMarkdownToSemantic({
            pluginConfig,
            getConfig: readCurrentConfig,
          });
          return {
            text:
              `Migration complete: ${outcome.chunksStored} chunk(s) stored from ${outcome.filesScanned} file(s).` +
              (outcome.errors.length ? ` ${outcome.errors.length} error(s).` : ""),
          };
        } catch (err) {
          return { text: `Migration failed: ${String(err)}` };
        }
      },
    });
  },
});
