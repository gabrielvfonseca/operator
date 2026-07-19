// Plugin install plan tests cover install planning for local, registry, and bundled plugins.
import { installedPluginRoot } from "@gabrielvfonseca/operator/plugin-sdk/test-fixtures";
import { describe, expect, it, vi } from "vitest";
import { PLUGIN_INSTALL_ERROR_CODE } from "../plugins/install.js";
import {
  resolveCatalogOfficialExternalInstallPlan,
  resolveCatalogOfficialExternalNpmPackageTrust,
} from "../plugins/official-external-install-trust.js";
import {
  resolveBundledInstallPlanForCatalogEntry,
  resolveBundledInstallPlanBeforeNpm,
  resolveBundledInstallPlanForNpmFailure,
} from "./plugin-install-plan.js";

describe("plugin install plan helpers", () => {
  it("prefers bundled plugin for bare plugin-id specs", () => {
    const findBundledSource = vi.fn().mockReturnValue({
      pluginId: "voice-call",
      localPath: installedPluginRoot("/tmp", "voice-call"),
      npmSpec: "@gabrielvfonseca/voice-call",
    });

    const result = resolveBundledInstallPlanBeforeNpm({
      rawSpec: "voice-call",
      findBundledSource,
    });

    expect(findBundledSource).toHaveBeenCalledWith({ kind: "pluginId", value: "voice-call" });
    expect(result?.bundledSource.pluginId).toBe("voice-call");
    expect(result?.warning).toContain('bare install spec "voice-call"');
  });

  it("prefers bundled plugin for scoped npm package specs", () => {
    const findBundledSource = vi
      .fn()
      .mockImplementation(({ kind, value }: { kind: "pluginId" | "npmSpec"; value: string }) => {
        if (kind === "npmSpec" && value === "@gabrielvfonseca/voice-call") {
          return {
            pluginId: "voice-call",
            localPath: installedPluginRoot("/tmp", "voice-call"),
            npmSpec: "@gabrielvfonseca/voice-call",
          };
        }
        return undefined;
      });
    const result = resolveBundledInstallPlanBeforeNpm({
      rawSpec: "@gabrielvfonseca/voice-call@2026.5.20",
      findBundledSource,
    });

    expect(findBundledSource).toHaveBeenCalledWith({
      kind: "npmSpec",
      value: "@gabrielvfonseca/voice-call@2026.5.20",
    });
    expect(findBundledSource).toHaveBeenCalledWith({
      kind: "npmSpec",
      value: "@gabrielvfonseca/voice-call",
    });
    expect(result?.bundledSource.pluginId).toBe("voice-call");
    expect(result?.warning).toContain('npm install spec "@gabrielvfonseca/voice-call@2026.5.20"');
    expect(result?.warning).toContain("npm:@gabrielvfonseca/voice-call@2026.5.20");
  });

  it("skips bundled pre-plan for npm specs that do not match bundled packages", () => {
    const findBundledSource = vi.fn();
    const result = resolveBundledInstallPlanBeforeNpm({
      rawSpec: "@gabrielvfonseca/not-bundled",
      findBundledSource,
    });

    expect(result).toBeNull();
  });

  it("resolves exact official external plugin ids before npm fallback", () => {
    const result = resolveCatalogOfficialExternalInstallPlan("wecom-operator-plugin");

    expect(result).toEqual({
      pluginId: "wecom-operator-plugin",
      npmSpec: "@wecom/wecom-operator-plugin@2026.5.7",
      expectedIntegrity:
        "sha512-TCkP9as00WfEhgFWG8YL/rcmaWGIshAki2HQh83nTRccGfVBCoGjrEboTTqq3yDmK9koWTV11zi8u8A4dNtvug==",
    });
  });

  it("skips official external plan for explicit npm selectors", () => {
    expect(resolveCatalogOfficialExternalInstallPlan("wecom-operator-plugin@beta")).toBeNull();
    expect(
      resolveCatalogOfficialExternalInstallPlan("@wecom/wecom-operator-plugin@2026.5.7"),
    ).toBeNull();
  });

  it("trusts exact official external npm packages without remapping the spec", () => {
    const result = resolveCatalogOfficialExternalNpmPackageTrust(
      "@wecom/wecom-operator-plugin@2026.5.7",
    );

    expect(result).toEqual({
      pluginId: "wecom-operator-plugin",
      expectedIntegrity:
        "sha512-TCkP9as00WfEhgFWG8YL/rcmaWGIshAki2HQh83nTRccGfVBCoGjrEboTTqq3yDmK9koWTV11zi8u8A4dNtvug==",
      trustedSourceLinkedOfficialInstall: true,
    });
  });

  it("does not trust npm package names outside the official external catalog", () => {
    const result = resolveCatalogOfficialExternalNpmPackageTrust("@acme/outside@1.0.0");

    expect(result).toBeNull();
  });

  it("prefers bundled catalog plugin by id before npm spec", () => {
    const findBundledSource = vi
      .fn()
      .mockImplementation(({ kind, value }: { kind: "pluginId" | "npmSpec"; value: string }) => {
        if (kind === "pluginId" && value === "voice-call") {
          return {
            pluginId: "voice-call",
            localPath: installedPluginRoot("/tmp", "voice-call"),
            npmSpec: "@gabrielvfonseca/voice-call",
          };
        }
        return undefined;
      });

    const result = resolveBundledInstallPlanForCatalogEntry({
      pluginId: "voice-call",
      npmSpec: "@gabrielvfonseca/voice-call",
      findBundledSource,
    });

    expect(findBundledSource).toHaveBeenCalledWith({ kind: "pluginId", value: "voice-call" });
    expect(result?.bundledSource.localPath).toBe(installedPluginRoot("/tmp", "voice-call"));
  });

  it("rejects npm-spec matches that resolve to a different plugin id", () => {
    const findBundledSource = vi
      .fn()
      .mockImplementation(({ kind }: { kind: "pluginId" | "npmSpec"; value: string }) => {
        if (kind === "npmSpec") {
          return {
            pluginId: "not-voice-call",
            localPath: installedPluginRoot("/tmp", "not-voice-call"),
            npmSpec: "@gabrielvfonseca/voice-call",
          };
        }
        return undefined;
      });

    const result = resolveBundledInstallPlanForCatalogEntry({
      pluginId: "voice-call",
      npmSpec: "@gabrielvfonseca/voice-call",
      findBundledSource,
    });

    expect(result).toBeNull();
  });

  it("rejects plugin-id bundled matches when the catalog npm spec was overridden", () => {
    const findBundledSource = vi
      .fn()
      .mockImplementation(({ kind }: { kind: "pluginId" | "npmSpec"; value: string }) => {
        if (kind === "pluginId") {
          return {
            pluginId: "whatsapp",
            localPath: installedPluginRoot("/tmp", "whatsapp"),
            npmSpec: "@gabrielvfonseca/whatsapp",
          };
        }
        return undefined;
      });

    const result = resolveBundledInstallPlanForCatalogEntry({
      pluginId: "whatsapp",
      npmSpec: "@vendor/whatsapp-fork",
      findBundledSource,
    });

    expect(result).toBeNull();
  });

  it("uses npm-spec bundled fallback only for package-not-found", () => {
    const findBundledSource = vi.fn().mockReturnValue({
      pluginId: "voice-call",
      localPath: installedPluginRoot("/tmp", "voice-call"),
      npmSpec: "@gabrielvfonseca/voice-call",
    });
    const result = resolveBundledInstallPlanForNpmFailure({
      rawSpec: "@gabrielvfonseca/voice-call",
      code: PLUGIN_INSTALL_ERROR_CODE.NPM_PACKAGE_NOT_FOUND,
      findBundledSource,
    });

    expect(findBundledSource).toHaveBeenCalledWith({
      kind: "npmSpec",
      value: "@gabrielvfonseca/voice-call",
    });
    expect(result?.warning).toContain("npm package unavailable");
  });

  it("skips fallback for non-not-found npm failures", () => {
    const findBundledSource = vi.fn();
    const result = resolveBundledInstallPlanForNpmFailure({
      rawSpec: "@gabrielvfonseca/voice-call",
      code: "INSTALL_FAILED",
      findBundledSource,
    });

    expect(findBundledSource).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
