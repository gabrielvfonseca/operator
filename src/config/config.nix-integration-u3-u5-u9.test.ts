// Covers Nix integration config compatibility scenarios U3, U5, and U9.
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GATEWAY_PORT,
  resolveConfigPathCandidate,
  resolveGatewayPort,
  resolveIsNixMode,
  resolveStateDir,
} from "./config.js";
import { withTempHome } from "./test-helpers.js";

vi.unmock("../version.js");

function envWith(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  // Hermetic env: don't inherit process.env because other tests may mutate it.
  return { ...overrides };
}

describe("Nix integration (U3, U5, U9)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("U3: isNixMode env var detection", () => {
    it("isNixMode is false when OPERATOR_NIX_MODE is not set", () => {
      expect(resolveIsNixMode(envWith({ OPERATOR_NIX_MODE: undefined }))).toBe(false);
    });

    it("isNixMode is false when OPERATOR_NIX_MODE is empty", () => {
      expect(resolveIsNixMode(envWith({ OPERATOR_NIX_MODE: "" }))).toBe(false);
    });

    it("isNixMode is false when OPERATOR_NIX_MODE is not '1'", () => {
      expect(resolveIsNixMode(envWith({ OPERATOR_NIX_MODE: "true" }))).toBe(false);
    });

    it("isNixMode is true when OPERATOR_NIX_MODE=1", () => {
      expect(resolveIsNixMode(envWith({ OPERATOR_NIX_MODE: "1" }))).toBe(true);
    });
  });

  describe("U5: CONFIG_PATH and STATE_DIR env var overrides", () => {
    it("STATE_DIR defaults to ~/.operator when env not set", () => {
      expect(resolveStateDir(envWith({ OPERATOR_STATE_DIR: undefined }))).toMatch(/\.operator$/);
    });

    it("STATE_DIR respects OPERATOR_STATE_DIR override", () => {
      expect(resolveStateDir(envWith({ OPERATOR_STATE_DIR: "/custom/state/dir" }))).toBe(
        path.resolve("/custom/state/dir"),
      );
    });

    it("STATE_DIR respects OPERATOR_HOME when state override is unset", () => {
      const customHome = path.join(path.sep, "custom", "home");
      expect(
        resolveStateDir(envWith({ OPERATOR_HOME: customHome, OPERATOR_STATE_DIR: undefined })),
      ).toBe(path.join(path.resolve(customHome), ".operator"));
    });

    it("CONFIG_PATH defaults to OPERATOR_HOME/.operator/operator.json", () => {
      const customHome = path.join(path.sep, "custom", "home");
      expect(
        resolveConfigPathCandidate(
          envWith({
            OPERATOR_HOME: customHome,
            OPERATOR_CONFIG_PATH: undefined,
            OPERATOR_STATE_DIR: undefined,
          }),
        ),
      ).toBe(path.join(path.resolve(customHome), ".operator", "operator.json"));
    });

    it("CONFIG_PATH defaults to ~/.operator/operator.json when env not set", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ OPERATOR_CONFIG_PATH: undefined, OPERATOR_STATE_DIR: undefined }),
        ),
      ).toMatch(/\.operator[\\/]openclaw\.json$/);
    });

    it("CONFIG_PATH respects OPERATOR_CONFIG_PATH override", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ OPERATOR_CONFIG_PATH: "/nix/store/abc/operator.json" }),
        ),
      ).toBe(path.resolve("/nix/store/abc/operator.json"));
    });

    it("CONFIG_PATH expands ~ in OPERATOR_CONFIG_PATH override", async () => {
      await withTempHome(async (home) => {
        expect(
          resolveConfigPathCandidate(
            envWith({ OPERATOR_HOME: home, OPERATOR_CONFIG_PATH: "~/.operator/custom.json" }),
            () => home,
          ),
        ).toBe(path.join(home, ".operator", "custom.json"));
      });
    });

    it("CONFIG_PATH uses STATE_DIR when only state dir is overridden", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ OPERATOR_STATE_DIR: "/custom/state", OPERATOR_TEST_FAST: "1" }),
          () => path.join(path.sep, "tmp", "operator-config-home"),
        ),
      ).toBe(path.join(path.resolve("/custom/state"), "operator.json"));
    });
  });

  describe("U6: gateway port resolution", () => {
    it("uses default when env and config are unset", () => {
      expect(resolveGatewayPort({}, envWith({ OPERATOR_GATEWAY_PORT: undefined }))).toBe(
        DEFAULT_GATEWAY_PORT,
      );
    });

    it("prefers OPERATOR_GATEWAY_PORT over config", () => {
      expect(
        resolveGatewayPort(
          { gateway: { port: 19002 } },
          envWith({ OPERATOR_GATEWAY_PORT: "19001" }),
        ),
      ).toBe(19001);
    });

    it("falls back to config when env is invalid", () => {
      expect(
        resolveGatewayPort(
          { gateway: { port: 19003 } },
          envWith({ OPERATOR_GATEWAY_PORT: "nope" }),
        ),
      ).toBe(19003);
    });
  });
});
