// Standalone runtime registry loader tests cover registry loading outside gateway startup.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearPluginLoaderCache } from "../loader.test-fixtures.js";
import { createEmptyPluginRegistry } from "../registry-empty.js";
import type { PluginRegistry } from "../registry-types.js";
import {
  getActivePluginChannelRegistry,
  getActivePluginRegistry,
  pinActivePluginChannelRegistry,
  resetPluginRuntimeStateForTest,
  setActivePluginRegistry,
} from "../runtime.js";

const loaderMocks = vi.hoisted(() => ({
  loadOperatorPlugins: vi.fn<typeof import("../loader.js").loadOperatorPlugins>(),
}));

vi.mock("../loader.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../loader.js")>();
  return {
    ...actual,
    loadOperatorPlugins: (...args: Parameters<typeof loaderMocks.loadOperatorPlugins>) =>
      loaderMocks.loadOperatorPlugins(...args),
  };
});

const { ensureStandaloneRuntimePluginRegistryLoaded } =
  await import("./standalone-runtime-registry-loader.js");

function createRegistryWithPlugin(pluginId: string): PluginRegistry {
  const registry = createEmptyPluginRegistry();
  registry.plugins.push({
    id: pluginId,
    status: "loaded",
  } as never);
  return registry;
}

beforeEach(() => {
  loaderMocks.loadOperatorPlugins.mockReset();
});

afterEach(() => {
  clearPluginLoaderCache();
  resetPluginRuntimeStateForTest();
});

describe("ensureStandaloneRuntimePluginRegistryLoaded tool-discovery installs", () => {
  it("does not replace active or pinned channel registries during tool discovery", () => {
    const activeRegistry = createRegistryWithPlugin("provider-only");
    setActivePluginRegistry(activeRegistry, "active-key", "default", "/tmp/ws");
    const channelRegistry = createRegistryWithPlugin("channel-plugin");
    pinActivePluginChannelRegistry(channelRegistry);
    const toolRegistry = createRegistryWithPlugin("tool-plugin");
    loaderMocks.loadOperatorPlugins.mockReturnValue(toolRegistry);

    ensureStandaloneRuntimePluginRegistryLoaded({
      surface: "channel",
      forceLoad: true,
      loadOptions: {
        onlyPluginIds: ["tool-plugin"],
        activate: false,
        toolDiscovery: true,
        workspaceDir: "/tmp/ws",
      },
    });

    expect(getActivePluginRegistry()).toBe(activeRegistry);
    expect(getActivePluginChannelRegistry()).toBe(channelRegistry);
  });

  it("does not replace the active registry for a tool-discovery active load", () => {
    const activeRegistry = createRegistryWithPlugin("provider-only");
    setActivePluginRegistry(activeRegistry, "active-key", "default", "/tmp/ws");
    const toolRegistry = createRegistryWithPlugin("tool-plugin");
    loaderMocks.loadOperatorPlugins.mockReturnValue(toolRegistry);

    const result = ensureStandaloneRuntimePluginRegistryLoaded({
      surface: "active",
      forceLoad: true,
      installRegistry: true,
      loadOptions: {
        onlyPluginIds: ["tool-plugin"],
        activate: false,
        toolDiscovery: true,
        workspaceDir: "/tmp/ws",
      },
    });

    expect(result).toBe(toolRegistry);
    expect(getActivePluginRegistry()).toBe(activeRegistry);
  });

  it("still installs a non-tool-discovery active load (migration provider path)", () => {
    const activeRegistry = createRegistryWithPlugin("provider-only");
    setActivePluginRegistry(activeRegistry, "active-key", "default", "/tmp/ws");
    const migrationRegistry = createRegistryWithPlugin("migration-plugin");
    loaderMocks.loadOperatorPlugins.mockReturnValue(migrationRegistry);

    ensureStandaloneRuntimePluginRegistryLoaded({
      surface: "active",
      forceLoad: true,
      installRegistry: true,
      loadOptions: {
        onlyPluginIds: ["migration-plugin"],
        activate: false,
        workspaceDir: "/tmp/ws",
      },
    });

    // Without toolDiscovery the load must still become the active registry, since the migration
    // provider resolver reads migrationProviders off the active registry.
    expect(getActivePluginRegistry()).toBe(migrationRegistry);
  });

  it("keeps runtime surfaces empty for a cold tool-discovery load", () => {
    // Establish the cold-start precondition deterministically (no active registry).
    resetPluginRuntimeStateForTest();
    const toolRegistry = createRegistryWithPlugin("tool-plugin");
    loaderMocks.loadOperatorPlugins.mockReturnValue(toolRegistry);

    const result = ensureStandaloneRuntimePluginRegistryLoaded({
      surface: "channel",
      forceLoad: true,
      loadOptions: {
        onlyPluginIds: ["tool-plugin"],
        activate: false,
        toolDiscovery: true,
        workspaceDir: "/tmp/ws",
      },
    });

    expect(result).toBe(toolRegistry);
    expect(getActivePluginRegistry()).toBeNull();
  });
});
