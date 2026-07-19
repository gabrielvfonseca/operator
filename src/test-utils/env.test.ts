// Tests environment helper behavior for isolated test homes.
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  captureEnv,
  captureFullEnv,
  createPathResolutionEnv,
  deleteTestEnvValue,
  setTestEnvValue,
  withEnv,
  withEnvAsync,
  withPathResolutionEnv,
} from "./env.js";

function restoreEnvKey(key: string, previous: string | undefined): void {
  if (previous === undefined) {
    deleteTestEnvValue(key);
  } else {
    setTestEnvValue(key, previous);
  }
}

describe("env test utils", () => {
  it("captureEnv restores mutated keys", () => {
    const keyA = "OPERATOR_ENV_TEST_A";
    const keyB = "OPERATOR_ENV_TEST_B";
    const snapshot = captureEnv([keyA, keyB]);
    const prevA = process.env[keyA];
    const prevB = process.env[keyB];
    setTestEnvValue(keyA, "mutated");
    deleteTestEnvValue(keyB);

    snapshot.restore();

    expect(process.env[keyA]).toBe(prevA);
    expect(process.env[keyB]).toBe(prevB);
  });

  it("captureFullEnv restores added keys and baseline values", () => {
    const key = "OPERATOR_ENV_TEST_ADDED";
    const prevHome = process.env.HOME;
    const snapshot = captureFullEnv();
    setTestEnvValue(key, "1");
    deleteTestEnvValue("HOME");

    snapshot.restore();

    expect(process.env[key]).toBeUndefined();
    expect(process.env.HOME).toBe(prevHome);
  });

  it("withEnv applies values only inside callback", () => {
    const key = "OPERATOR_ENV_TEST_SYNC";
    const prev = process.env[key];

    const seen = withEnv({ [key]: "inside" }, () => process.env[key]);

    expect(seen).toBe("inside");
    expect(process.env[key]).toBe(prev);
  });

  it("withEnv restores values when callback throws", () => {
    const key = "OPERATOR_ENV_TEST_SYNC_THROW";
    const prev = process.env[key];

    expect(() =>
      withEnv({ [key]: "inside" }, () => {
        expect(process.env[key]).toBe("inside");
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(process.env[key]).toBe(prev);
  });

  it("withEnv can delete a key only inside callback", () => {
    const key = "OPERATOR_ENV_TEST_SYNC_DELETE";
    const prev = process.env[key];
    setTestEnvValue(key, "outer");

    const seen = withEnv({ [key]: undefined }, () => process.env[key]);

    expect(seen).toBeUndefined();
    expect(process.env[key]).toBe("outer");
    restoreEnvKey(key, prev);
  });

  it("withEnvAsync restores values when callback throws", async () => {
    const key = "OPERATOR_ENV_TEST_ASYNC";
    const prev = process.env[key];

    await expect(
      withEnvAsync({ [key]: "inside" }, async () => {
        expect(process.env[key]).toBe("inside");
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(process.env[key]).toBe(prev);
  });

  it("withEnvAsync applies values only inside async callback", async () => {
    const key = "OPERATOR_ENV_TEST_ASYNC_OK";
    const prev = process.env[key];

    const seen = await withEnvAsync({ [key]: "inside" }, async () => process.env[key]);

    expect(seen).toBe("inside");
    expect(process.env[key]).toBe(prev);
  });

  it("withEnvAsync can delete a key only inside callback", async () => {
    const key = "OPERATOR_ENV_TEST_ASYNC_DELETE";
    const prev = process.env[key];
    setTestEnvValue(key, "outer");

    const seen = await withEnvAsync({ [key]: undefined }, async () => process.env[key]);

    expect(seen).toBeUndefined();
    expect(process.env[key]).toBe("outer");
    restoreEnvKey(key, prev);
  });

  it("createPathResolutionEnv clears leaked path overrides before applying explicit ones", () => {
    const homeDir = path.join(path.sep, "tmp", "operator-home");
    const resolvedHomeDir = path.resolve(homeDir);
    const previousOperatorHome = process.env.OPERATOR_HOME;
    const previousStateDir = process.env.OPERATOR_STATE_DIR;
    const previousBundledDir = process.env.OPERATOR_BUNDLED_PLUGINS_DIR;
    setTestEnvValue("OPERATOR_HOME", "/srv/operator-home");
    setTestEnvValue("OPERATOR_STATE_DIR", "/srv/operator-state");
    setTestEnvValue("OPERATOR_BUNDLED_PLUGINS_DIR", "/srv/operator-bundled");

    try {
      const env = createPathResolutionEnv(homeDir, {
        OPERATOR_STATE_DIR: "~/state",
      });

      expect(env.HOME).toBe(resolvedHomeDir);
      expect(env.OPERATOR_HOME).toBeUndefined();
      expect(env.OPERATOR_BUNDLED_PLUGINS_DIR).toBeUndefined();
      expect(env.OPERATOR_STATE_DIR).toBe("~/state");
    } finally {
      restoreEnvKey("OPERATOR_HOME", previousOperatorHome);
      restoreEnvKey("OPERATOR_STATE_DIR", previousStateDir);
      restoreEnvKey("OPERATOR_BUNDLED_PLUGINS_DIR", previousBundledDir);
    }
  });

  it("withPathResolutionEnv only applies the explicit path env inside the callback", () => {
    const homeDir = path.join(path.sep, "tmp", "operator-home");
    const resolvedHomeDir = path.resolve(homeDir);
    const previousOperatorHome = process.env.OPERATOR_HOME;
    setTestEnvValue("OPERATOR_HOME", "/srv/operator-home");

    try {
      const seen = withPathResolutionEnv(
        homeDir,
        { OPERATOR_BUNDLED_PLUGINS_DIR: "~/bundled" },
        (env) => ({
          processHome: process.env.HOME,
          processOperatorHome: process.env.OPERATOR_HOME,
          processBundledDir: process.env.OPERATOR_BUNDLED_PLUGINS_DIR,
          envBundledDir: env.OPERATOR_BUNDLED_PLUGINS_DIR,
        }),
      );

      expect(seen).toEqual({
        processHome: resolvedHomeDir,
        processOperatorHome: undefined,
        processBundledDir: "~/bundled",
        envBundledDir: "~/bundled",
      });
      expect(process.env.OPERATOR_HOME).toBe("/srv/operator-home");
    } finally {
      restoreEnvKey("OPERATOR_HOME", previousOperatorHome);
    }
  });
});
