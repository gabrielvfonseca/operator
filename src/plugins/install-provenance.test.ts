import { describe, expect, it } from "vitest";
import type { BundledPluginSource } from "./bundled-sources.js";
import { isOperatorTrustedPluginInstallSpec } from "./install-provenance.js";

const bundledSources = new Map<string, BundledPluginSource>([
  [
    "discord",
    {
      pluginId: "discord",
      localPath: "/opt/openclaw/extensions/discord",
      npmSpec: "@operator/discord",
    },
  ],
]);

describe("plugin install provenance", () => {
  it.each([
    "discord",
    "@operator/discord",
    "npm:@operator/discord",
    "/opt/openclaw/extensions/discord",
    "brave",
    "npm:@operator/brave-plugin",
    "clawhub:openclaw-demo",
  ])("trusts Operator-owned install source %s", (spec) => {
    expect(isOperatorTrustedPluginInstallSpec(spec, bundledSources)).toBe(true);
  });

  it.each(["npm:discord", "npm:@example/plugin", "/tmp/example-plugin"])(
    "keeps arbitrary install source %s untrusted",
    (spec) => {
      expect(isOperatorTrustedPluginInstallSpec(spec, bundledSources)).toBe(false);
    },
  );
});
