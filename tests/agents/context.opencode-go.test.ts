import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolveMemoryFlushContextWindowTokens } from "../../src/auto-reply/reply/memory-flush.js";
import type { OperatorConfig } from "../../src/config/types.operator.js";
import { refreshContextWindowCache, resetContextWindowCacheForTest } from "../../src/agents/context.js";

describe("OpenCode Go context metadata", () => {
  let contextWindowTokens: number | undefined;
  let configuredModels: OperatorConfig["models"];

  beforeAll(async () => {
    const cfg: OperatorConfig = { plugins: { allow: ["opencode-go"] } };

    await refreshContextWindowCache(cfg);
    contextWindowTokens = resolveMemoryFlushContextWindowTokens({
      cfg,
      provider: "opencode-go",
      modelId: "deepseek-v4-pro",
    });
    configuredModels = cfg.models;
  });

  afterAll(() => {
    resetContextWindowCacheForTest();
  });

  it("warms the provider-owned context window without writing model config", () => {
    expect(contextWindowTokens).toBe(1_000_000);
    expect(configuredModels).toBeUndefined();
  });
});
