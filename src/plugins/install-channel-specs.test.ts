import { describe, expect, it } from "vitest";
import {
  resolveClawHubInstallSpecsForUpdateChannel,
  resolveNpmInstallSpecsForUpdateChannel,
} from "./install-channel-specs.js";

describe("resolveNpmInstallSpecsForUpdateChannel", () => {
  it.each(["@gabrielvfonseca/discord", "@gabrielvfonseca/discord@latest"])(
    "targets the exact core version for official extended-stable intent %s",
    (spec) => {
      expect(
        resolveNpmInstallSpecsForUpdateChannel({
          spec,
          updateChannel: "extended-stable",
          officialPackageName: "@gabrielvfonseca/discord",
          coreVersion: "2026.7.33",
        }),
      ).toEqual({
        installSpec: "@gabrielvfonseca/discord@2026.7.33",
        recordSpec: spec,
      });
    },
  );

  it.each([
    "@gabrielvfonseca/discord@2026.6.33",
    "@gabrielvfonseca/discord@next",
    "@gabrielvfonseca/discord@beta",
    "@gabrielvfonseca/discord@^2026.6.0",
    "https://registry.example.test/discord.tgz",
  ])("preserves explicit extended-stable intent %s", (spec) => {
    expect(
      resolveNpmInstallSpecsForUpdateChannel({
        spec,
        updateChannel: "extended-stable",
        officialPackageName: "@gabrielvfonseca/discord",
        coreVersion: "2026.7.33",
      }),
    ).toEqual({ installSpec: spec, recordSpec: spec });
  });

  it("does not rewrite a third-party package", () => {
    expect(
      resolveNpmInstallSpecsForUpdateChannel({
        spec: "@acme/discord",
        updateChannel: "extended-stable",
        officialPackageName: "@gabrielvfonseca/discord",
        coreVersion: "2026.7.33",
      }),
    ).toEqual({ installSpec: "@acme/discord", recordSpec: "@acme/discord" });
  });

  it("fails closed without an authoritative extended-stable core version", () => {
    expect(() =>
      resolveNpmInstallSpecsForUpdateChannel({
        spec: "@gabrielvfonseca/discord",
        updateChannel: "extended-stable",
        officialPackageName: "@gabrielvfonseca/discord",
      }),
    ).toThrow("requires an exact core version");
  });

  it("preserves beta behavior", () => {
    expect(
      resolveNpmInstallSpecsForUpdateChannel({
        spec: "@gabrielvfonseca/discord@latest",
        updateChannel: "beta",
        officialPackageName: "@gabrielvfonseca/discord",
        coreVersion: "2026.7.33",
      }),
    ).toEqual({
      installSpec: "@gabrielvfonseca/discord@beta",
      recordSpec: "@gabrielvfonseca/discord@latest",
      fallbackSpec: "@gabrielvfonseca/discord@latest",
      fallbackLabel: "@gabrielvfonseca/discord@beta",
    });
  });
});

describe("resolveClawHubInstallSpecsForUpdateChannel", () => {
  it("does not rewrite ClawHub on extended-stable", () => {
    expect(
      resolveClawHubInstallSpecsForUpdateChannel({
        spec: "clawhub:@gabrielvfonseca/discord",
        updateChannel: "extended-stable",
      }),
    ).toEqual({
      installSpec: "clawhub:@gabrielvfonseca/discord",
      recordSpec: "clawhub:@gabrielvfonseca/discord",
    });
  });
});
