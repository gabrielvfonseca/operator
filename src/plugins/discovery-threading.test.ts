// Covers plugin discovery threading and concurrency behavior.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PluginDiscoveryResult } from "./discovery.js";

const discoverOperatorPluginsMock = vi.fn();

vi.mock("./discovery.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./discovery.js")>();
  return {
    ...actual,
    discoverOperatorPlugins: (...args: unknown[]) => discoverOperatorPluginsMock(...args),
  };
});

const { loadPluginManifestRegistry } = await import("./manifest-registry.js");
const { resolveInstalledPluginIndexRegistry } =
  await import("./installed-plugin-index-registry.js");

const emptyDiscovery: PluginDiscoveryResult = { candidates: [], diagnostics: [] };

describe("discovery threading", () => {
  beforeEach(() => {
    discoverOperatorPluginsMock.mockReset();
    discoverOperatorPluginsMock.mockReturnValue(emptyDiscovery);
  });

  it("skips internal discoverOperatorPlugins when discovery is supplied", () => {
    loadPluginManifestRegistry({ discovery: emptyDiscovery });
    expect(discoverOperatorPluginsMock).not.toHaveBeenCalled();

    discoverOperatorPluginsMock.mockClear();
    resolveInstalledPluginIndexRegistry({ discovery: emptyDiscovery, installRecords: {} });
    expect(discoverOperatorPluginsMock).not.toHaveBeenCalled();
  });

  it("calls discoverOperatorPlugins when neither discovery nor candidates supplied", () => {
    loadPluginManifestRegistry({});
    expect(discoverOperatorPluginsMock).toHaveBeenCalledTimes(1);

    discoverOperatorPluginsMock.mockClear();
    resolveInstalledPluginIndexRegistry({ installRecords: {} });
    expect(discoverOperatorPluginsMock).toHaveBeenCalledTimes(1);
  });

  it("prefers explicit candidates over discovery when both are supplied", () => {
    loadPluginManifestRegistry({ candidates: [], diagnostics: [], discovery: emptyDiscovery });
    expect(discoverOperatorPluginsMock).not.toHaveBeenCalled();

    discoverOperatorPluginsMock.mockClear();
    resolveInstalledPluginIndexRegistry({
      candidates: [],
      discovery: emptyDiscovery,
      installRecords: {},
    });
    expect(discoverOperatorPluginsMock).not.toHaveBeenCalled();
  });
});
