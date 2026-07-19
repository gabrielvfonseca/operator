// Command path policy tests cover allowed CLI command path shapes and lazy imports.
import { importFreshModule } from "@gabrielvfonseca/operator/plugin-sdk/test-fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CliCommandCatalogEntry, CliCommandPathPolicy } from "./command-catalog.js";
import {
  resolveCliCommandPathPolicy,
  resolveCliNetworkProxyPolicy,
} from "./command-path-policy.js";

const DEFAULT_EXPECTED_POLICY: CliCommandPathPolicy = {
  bypassConfigGuard: false,
  routeConfigGuard: "never",
  loadPlugins: "never",
  pluginRegistry: { scope: "all" },
  ownsProtocolStdout: false,
  hideBanner: false,
  ensureCliPath: true,
  networkProxy: "default",
};

type NetworkProxyResolver = Extract<
  CliCommandPathPolicy["networkProxy"],
  (ctx: { argv: string[]; commandPath: string[] }) => unknown
>;
type LoadPluginsResolver = Extract<
  CliCommandPathPolicy["loadPlugins"],
  (ctx: { argv: string[]; commandPath: string[]; jsonOutputMode: boolean }) => unknown
>;

function expectResolvedPolicy(
  commandPath: string[],
  expected: Partial<CliCommandPathPolicy>,
): void {
  expect(resolveCliCommandPathPolicy(commandPath)).toEqual({
    ...DEFAULT_EXPECTED_POLICY,
    ...expected,
  });
}

function expectNetworkProxyResolver(
  policy: CliCommandPathPolicy,
): asserts policy is CliCommandPathPolicy & { networkProxy: NetworkProxyResolver } {
  expect(typeof policy.networkProxy).toBe("function");
}

function expectLoadPluginsResolver(
  policy: CliCommandPathPolicy,
): asserts policy is CliCommandPathPolicy & { loadPlugins: LoadPluginsResolver } {
  expect(typeof policy.loadPlugins).toBe("function");
}

describe("command-path-policy", () => {
  afterEach(() => {
    vi.doUnmock("./command-catalog.js");
    vi.resetModules();
  });

  it("resolves status policy with shared startup semantics", () => {
    expectResolvedPolicy(["status"], {
      routeConfigGuard: "never",
      loadPlugins: "never",
      pluginRegistry: { scope: "channels" },
      ensureCliPath: false,
      networkProxy: "bypass",
    });
  });

  it("applies exact overrides after broader channel plugin rules", () => {
    expectResolvedPolicy(["channels", "send"], {
      loadPlugins: "always",
      pluginRegistry: { scope: "configured-channels" },
    });
    expectResolvedPolicy(["channels", "login"], {
      loadPlugins: "always",
      pluginRegistry: { scope: "configured-channels" },
    });
    expectResolvedPolicy(["channels", "capabilities"], {
      loadPlugins: "always",
      pluginRegistry: { scope: "configured-channels" },
    });
    expectResolvedPolicy(["channels", "add"], {
      loadPlugins: "never",
      pluginRegistry: { scope: "configured-channels" },
      networkProxy: "bypass",
    });
    const channelsStatusPolicy = resolveCliCommandPathPolicy(["channels", "status"]);
    expect(channelsStatusPolicy).toEqual({
      ...DEFAULT_EXPECTED_POLICY,
      loadPlugins: "never",
      pluginRegistry: { scope: "configured-channels" },
      networkProxy: channelsStatusPolicy.networkProxy,
    });
    expectNetworkProxyResolver(channelsStatusPolicy);
    expect(
      channelsStatusPolicy.networkProxy({
        argv: ["node", "@gabrielvfonseca/operator", "channels", "status"],
        commandPath: ["channels", "status"],
      }),
    ).toBe("bypass");
    expect(
      channelsStatusPolicy.networkProxy({
        argv: ["node", "@gabrielvfonseca/operator", "channels", "status", "--probe"],
        commandPath: ["channels", "status"],
      }),
    ).toBe("default");
    expectResolvedPolicy(["channels", "list"], {
      loadPlugins: "never",
      pluginRegistry: { scope: "configured-channels" },
      networkProxy: "bypass",
    });
    expectResolvedPolicy(["channels", "logs"], {
      loadPlugins: "never",
      pluginRegistry: { scope: "configured-channels" },
      networkProxy: "bypass",
    });
    expectResolvedPolicy(["channels", "remove"], {
      loadPlugins: "always",
      pluginRegistry: { scope: "configured-channels" },
      networkProxy: "bypass",
    });
    expectResolvedPolicy(["channels", "resolve"], {
      loadPlugins: "always",
      pluginRegistry: { scope: "configured-channels" },
      networkProxy: "bypass",
    });
  });

  it("keeps config-only agent commands on config-only startup", () => {
    const agentPolicy = resolveCliCommandPathPolicy(["agent"]);
    expect(agentPolicy).toEqual({
      ...DEFAULT_EXPECTED_POLICY,
      loadPlugins: agentPolicy.loadPlugins,
      pluginRegistry: { scope: "all" },
      networkProxy: agentPolicy.networkProxy,
    });
    expectLoadPluginsResolver(agentPolicy);
    expectNetworkProxyResolver(agentPolicy);
    expect(
      agentPolicy.loadPlugins({
        argv: ["node", "@gabrielvfonseca/operator", "agent"],
        commandPath: ["agent"],
        jsonOutputMode: false,
      }),
    ).toBe(true);
    expect(
      agentPolicy.loadPlugins({
        argv: ["node", "@gabrielvfonseca/operator", "agent", "--json"],
        commandPath: ["agent"],
        jsonOutputMode: true,
      }),
    ).toBe(false);
    expect(
      agentPolicy.loadPlugins({
        argv: ["node", "@gabrielvfonseca/operator", "agent", "--local"],
        commandPath: ["agent"],
        jsonOutputMode: true,
      }),
    ).toBe(true);
    expect(
      agentPolicy.networkProxy({
        argv: ["node", "@gabrielvfonseca/operator", "agent"],
        commandPath: ["agent"],
      }),
    ).toBe("bypass");
    expect(
      agentPolicy.networkProxy({
        argv: ["node", "@gabrielvfonseca/operator", "agent", "--local"],
        commandPath: ["agent"],
      }),
    ).toBe("default");

    for (const commandPath of [
      ["agents"],
      ["agents", "list"],
      ["agents", "bind"],
      ["agents", "bindings"],
      ["agents", "unbind"],
      ["agents", "set-identity"],
      ["agents", "delete"],
    ]) {
      expectResolvedPolicy(commandPath, {
        loadPlugins: "never",
        networkProxy: "bypass",
      });
    }
  });

  it("resolves mixed startup-only rules", () => {
    expectResolvedPolicy(["worker"], {
      bypassConfigGuard: true,
      loadPlugins: "never",
      hideBanner: true,
      ownsProtocolStdout: true,
      networkProxy: "bypass",
    });
    expectResolvedPolicy(["configure"], {
      bypassConfigGuard: true,
      loadPlugins: "never",
    });
    expectResolvedPolicy(["config"], {
      bypassConfigGuard: true,
      loadPlugins: "never",
      networkProxy: "bypass",
    });
    expectResolvedPolicy(["config", "set"], {
      loadPlugins: "never",
      networkProxy: "bypass",
    });
    const doctorPolicy = resolveCliCommandPathPolicy(["doctor"]);
    expectNetworkProxyResolver(doctorPolicy);
    expect(doctorPolicy).toMatchObject({
      bypassConfigGuard: true,
      loadPlugins: "never",
    });
    expect(
      doctorPolicy.networkProxy({
        argv: ["node", "@gabrielvfonseca/operator", "doctor"],
        commandPath: ["doctor"],
      }),
    ).toBe("default");
    expect(
      doctorPolicy.networkProxy({
        argv: ["node", "@gabrielvfonseca/operator", "doctor", "--state-sqlite=compact"],
        commandPath: ["doctor"],
      }),
    ).toBe("bypass");
    expectResolvedPolicy(["config", "validate"], {
      bypassConfigGuard: true,
      loadPlugins: "never",
      networkProxy: "bypass",
    });
    expectResolvedPolicy(["gateway", "status"], {
      routeConfigGuard: "always",
      loadPlugins: "never",
      networkProxy: "bypass",
    });
    expectResolvedPolicy(["plugins", "update"], {
      loadPlugins: "never",
      hideBanner: true,
    });
    expectResolvedPolicy(["plugins", "list"], {
      ensureCliPath: false,
      loadPlugins: "never",
      networkProxy: "bypass",
    });
    for (const commandPath of [["tasks"], ["tasks", "list"], ["tasks", "audit"]]) {
      expectResolvedPolicy(commandPath, {
        ensureCliPath: false,
        loadPlugins: "never",
        networkProxy: "bypass",
      });
    }
    for (const commandPath of [
      ["plugins", "install"],
      ["plugins", "inspect"],
      ["plugins", "registry"],
      ["plugins", "doctor"],
    ]) {
      expectResolvedPolicy(commandPath, {
        loadPlugins: "never",
      });
    }
    expectResolvedPolicy(["cron", "list"], {
      bypassConfigGuard: true,
      loadPlugins: "never",
      networkProxy: "bypass",
    });
  });

  it("defaults unknown command paths to network proxy routing", () => {
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "googlemeet", "login"]),
    ).toBe("default");
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "tool", "image_generate"]),
    ).toBe("bypass");
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "tools", "effective"]),
    ).toBe("bypass");
  });

  it("resolves static network proxy bypass policies from the catalog", () => {
    expect(resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "status"])).toBe(
      "bypass",
    );
    expect(
      resolveCliNetworkProxyPolicy([
        "node",
        "@gabrielvfonseca/operator",
        "config",
        "get",
        "proxy.enabled",
      ]),
    ).toBe("bypass");
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "proxy", "start"]),
    ).toBe("bypass");
  });

  it("resolves mixed network proxy policies from argv-sensitive catalog entries", () => {
    expect(resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "gateway"])).toBe(
      "default",
    );
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "gateway", "run"]),
    ).toBe("default");
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "gateway", "health"]),
    ).toBe("bypass");
    expect(resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "node", "run"])).toBe(
      "default",
    );
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "node", "status"]),
    ).toBe("bypass");
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "agent", "--local"]),
    ).toBe("default");
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "agent", "run"]),
    ).toBe("bypass");
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "channels", "status"]),
    ).toBe("bypass");
    expect(
      resolveCliNetworkProxyPolicy([
        "node",
        "@gabrielvfonseca/operator",
        "channels",
        "status",
        "--probe",
      ]),
    ).toBe("default");
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "models", "status"]),
    ).toBe("bypass");
    expect(
      resolveCliNetworkProxyPolicy([
        "node",
        "@gabrielvfonseca/operator",
        "models",
        "status",
        "--probe",
      ]),
    ).toBe("default");
    expect(
      resolveCliNetworkProxyPolicy([
        "node",
        "@gabrielvfonseca/operator",
        "skills",
        "info",
        "browser",
      ]),
    ).toBe("bypass");
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "skills", "check"]),
    ).toBe("bypass");
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "skills", "list"]),
    ).toBe("bypass");
    expect(
      resolveCliNetworkProxyPolicy([
        "node",
        "@gabrielvfonseca/operator",
        "skills",
        "search",
        "browser",
      ]),
    ).toBe("default");
  });

  it("uses the longest catalog command path for deep network proxy overrides", async () => {
    const catalog: readonly CliCommandCatalogEntry[] = [
      { commandPath: ["nodes"], policy: { networkProxy: "bypass" } },
      {
        commandPath: ["nodes", "camera", "snap"],
        exact: true,
        policy: { networkProxy: "default" },
      },
    ];

    vi.doMock("./command-catalog.js", async (importOriginal) => {
      const actual = await importOriginal<typeof import("./command-catalog.js")>();
      return { ...actual, cliCommandCatalog: catalog };
    });
    const { resolveCliNetworkProxyPolicy: resolveCliNetworkProxyPolicyLocal } =
      await importFreshModule<typeof import("./command-path-policy.js")>(
        import.meta.url,
        "./command-path-policy.js?catalog-overrides",
      );

    expect(
      resolveCliNetworkProxyPolicyLocal([
        "node",
        "@gabrielvfonseca/operator",
        "nodes",
        "camera",
        "snap",
      ]),
    ).toBe("default");
    expect(
      resolveCliNetworkProxyPolicyLocal([
        "node",
        "@gabrielvfonseca/operator",
        "nodes",
        "camera",
        "list",
      ]),
    ).toBe("bypass");
  });

  it("stops catalog policy resolution before positional arguments", () => {
    expect(
      resolveCliNetworkProxyPolicy([
        "node",
        "@gabrielvfonseca/operator",
        "config",
        "get",
        "proxy.enabled",
      ]),
    ).toBe("bypass");
    expect(
      resolveCliNetworkProxyPolicy([
        "node",
        "@gabrielvfonseca/operator",
        "message",
        "send",
        "--to",
        "demo",
      ]),
    ).toBe("default");
  });

  it("treats bare gateway invocations with options as the gateway runtime", () => {
    const argv = ["node", "@gabrielvfonseca/operator", "gateway", "--port", "1234"];

    expect(resolveCliNetworkProxyPolicy(argv)).toBe("default");
  });

  it("resolves gateway runs after root options with values", () => {
    const argv = ["node", "@gabrielvfonseca/operator", "--log-level", "debug", "gateway", "run"];

    expect(resolveCliNetworkProxyPolicy(argv)).toBe("default");
  });

  it("does not let gateway run option values spoof bypass subcommands", () => {
    for (const argv of [
      ["node", "@gabrielvfonseca/operator", "gateway", "--token", "status"],
      ["node", "@gabrielvfonseca/operator", "gateway", "--token=status"],
      ["node", "@gabrielvfonseca/operator", "gateway", "--password", "health"],
      ["node", "@gabrielvfonseca/operator", "gateway", "--password-file", "status"],
      ["node", "@gabrielvfonseca/operator", "gateway", "--ws-log", "compact"],
    ]) {
      expect(resolveCliNetworkProxyPolicy(argv), argv.join(" ")).toBe("default");
    }
  });

  it("still resolves real gateway bypass subcommands after their command token", () => {
    expect(
      resolveCliNetworkProxyPolicy(["node", "@gabrielvfonseca/operator", "gateway", "status"]),
    ).toBe("bypass");
    expect(
      resolveCliNetworkProxyPolicy([
        "node",
        "@gabrielvfonseca/operator",
        "gateway",
        "status",
        "--token",
        "secret",
      ]),
    ).toBe("bypass");
  });
});
