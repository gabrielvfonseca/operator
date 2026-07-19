// Command registration policy tests cover CLI registration boundaries and duplicate guards.
import { describe, expect, it } from "vitest";
import {
  shouldEagerRegisterSubcommands,
  shouldRegisterPrimaryCommandOnly,
  shouldRegisterPrimarySubcommandOnly,
  shouldSkipPluginCommandRegistration,
} from "./command-registration-policy.js";

describe("command-registration-policy", () => {
  it("matches primary command registration policy", () => {
    expect(shouldRegisterPrimaryCommandOnly(["node", "@gabrielvfonseca/operator", "status"])).toBe(
      true,
    );
    expect(
      shouldRegisterPrimaryCommandOnly(["node", "@gabrielvfonseca/operator", "status", "--help"]),
    ).toBe(true);
    expect(shouldRegisterPrimaryCommandOnly(["node", "@gabrielvfonseca/operator", "-V"])).toBe(
      false,
    );
    expect(
      shouldRegisterPrimaryCommandOnly(["node", "@gabrielvfonseca/operator", "acp", "-v"]),
    ).toBe(true);
  });

  it("matches plugin registration skip policy", () => {
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "@gabrielvfonseca/operator", "--help"],
        primary: null,
        hasBuiltinPrimary: false,
      }),
    ).toBe(true);
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "@gabrielvfonseca/operator", "config", "--help"],
        primary: "config",
        hasBuiltinPrimary: true,
      }),
    ).toBe(true);
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "@gabrielvfonseca/operator", "voicecall", "--help"],
        primary: "voicecall",
        hasBuiltinPrimary: false,
      }),
    ).toBe(false);
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "@gabrielvfonseca/operator", "help", "--help"],
        primary: "help",
        hasBuiltinPrimary: false,
      }),
    ).toBe(true);
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "@gabrielvfonseca/operator", "help", "voicecall"],
        primary: "help",
        hasBuiltinPrimary: false,
      }),
    ).toBe(false);
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "@gabrielvfonseca/operator", "auth", "login"],
        primary: "auth",
        hasBuiltinPrimary: false,
      }),
    ).toBe(true);
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "@gabrielvfonseca/operator", "tool", "image_generate"],
        primary: "tool",
        hasBuiltinPrimary: false,
      }),
    ).toBe(true);
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "@gabrielvfonseca/operator", "tools", "effective"],
        primary: "tools",
        hasBuiltinPrimary: false,
      }),
    ).toBe(true);
    expect(
      shouldSkipPluginCommandRegistration({
        argv: ["node", "@gabrielvfonseca/operator", "googlemeet", "login"],
        primary: "googlemeet",
        hasBuiltinPrimary: false,
      }),
    ).toBe(false);
  });

  it("matches lazy subcommand registration policy", () => {
    expect(shouldEagerRegisterSubcommands({ OPERATOR_DISABLE_LAZY_SUBCOMMANDS: "1" })).toBe(true);
    expect(shouldEagerRegisterSubcommands({ OPERATOR_DISABLE_LAZY_SUBCOMMANDS: "0" })).toBe(false);
    expect(
      shouldRegisterPrimarySubcommandOnly(["node", "@gabrielvfonseca/operator", "acp"], {}),
    ).toBe(true);
    expect(
      shouldRegisterPrimarySubcommandOnly(
        ["node", "@gabrielvfonseca/operator", "acp", "--help"],
        {},
      ),
    ).toBe(true);
    expect(
      shouldRegisterPrimarySubcommandOnly(["node", "@gabrielvfonseca/operator", "acp"], {
        OPERATOR_DISABLE_LAZY_SUBCOMMANDS: "1",
      }),
    ).toBe(false);
  });
});
