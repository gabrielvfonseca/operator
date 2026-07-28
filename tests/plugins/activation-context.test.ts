// Covers plugin activation context construction and lazy boundaries.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPluginMetadataSnapshot,
  makeRegistry,
} from "../../src/config/plugin-auto-enable.test-helpers.js";
import type { OperatorConfig } from "../../src/config/types.operator.js";
import {
  clearCurrentPluginMetadataSnapshot,
  setCurrentPluginMetadataSnapshot,
} from "../../src/plugins/current-plugin-metadata-snapshot.js";

const applyPluginAutoEnableMock = vi.hoisted(() =>
  vi.fn((params: { config?: OperatorConfig }) => ({
    config: params.config,
    changes: [],
    autoEnabledReasons: {},
  })),
);

vi.mock("../config/plugin-auto-enable.js", () => ({
  applyPluginAutoEnable: applyPluginAutoEnableMock,
}));

import { resolveBundledPluginCompatibleActivationInputs } from "../../src/plugins/activation-context.js";

afterEach(() => {
  clearCurrentPluginMetadataSnapshot();
  applyPluginAutoEnableMock.mockClear();
});

describe("resolveBundledPluginCompatibleActivationInputs", () => {
  it("passes the current manifest registry into activation auto-enable", () => {
    const manifestRegistry = makeRegistry([{ id: "openai", channels: [], providers: ["openai"] }]);
    const workspaceDir = "/tmp/operator-activation-workspace";
    setCurrentPluginMetadataSnapshot(
      createPluginMetadataSnapshot({
        config: {},
        manifestRegistry,
        workspaceDir,
      }),
      {
        config: {},
        workspaceDir,
      },
    );

    resolveBundledPluginCompatibleActivationInputs({
      rawConfig: { plugins: { allow: ["openai"] } },
      workspaceDir,
      applyAutoEnable: true,
      compatMode: {},
      resolveCompatPluginIds: () => [],
    });

    expect(applyPluginAutoEnableMock).toHaveBeenCalledWith({
      config: { plugins: { allow: ["openai"] } },
      env: process.env,
      manifestRegistry,
    });
  });
});
