// Tests Operator execution environment construction.
import { describe, expect, it } from "vitest";
import { deleteTestEnvValue, setTestEnvValue } from "../test-utils/env.js";
import {
  ensureOperatorExecMarkerOnProcess,
  markOperatorExecEnv,
  OPERATOR_CLI_ENV_VAR,
} from "./operator-exec-env.js";

const OPERATOR_CLI_ENV_VALUE = "1";

describe("markOperatorExecEnv", () => {
  it("returns a cloned env object with the exec marker set", () => {
    const env = { PATH: "/usr/bin", OPERATOR_CLI: "0" };
    const marked = markOperatorExecEnv(env);

    expect(marked).toEqual({
      PATH: "/usr/bin",
      OPERATOR_CLI: OPERATOR_CLI_ENV_VALUE,
    });
    expect(marked).not.toBe(env);
    expect(env.OPERATOR_CLI).toBe("0");
  });
});

describe("ensureOperatorExecMarkerOnProcess", () => {
  it.each([
    {
      name: "mutates and returns the provided process env",
      env: { PATH: "/usr/bin" } as NodeJS.ProcessEnv,
    },
    {
      name: "overwrites an existing marker on the provided process env",
      env: { PATH: "/usr/bin", [OPERATOR_CLI_ENV_VAR]: "0" } as NodeJS.ProcessEnv,
    },
  ])("$name", ({ env }) => {
    expect(ensureOperatorExecMarkerOnProcess(env)).toBe(env);
    expect(env[OPERATOR_CLI_ENV_VAR]).toBe(OPERATOR_CLI_ENV_VALUE);
  });

  it("defaults to mutating process.env when no env object is provided", () => {
    const previous = process.env[OPERATOR_CLI_ENV_VAR];
    deleteTestEnvValue(OPERATOR_CLI_ENV_VAR);

    try {
      expect(ensureOperatorExecMarkerOnProcess()).toBe(process.env);
      expect(process.env[OPERATOR_CLI_ENV_VAR]).toBe(OPERATOR_CLI_ENV_VALUE);
    } finally {
      if (previous === undefined) {
        deleteTestEnvValue(OPERATOR_CLI_ENV_VAR);
      } else {
        setTestEnvValue(OPERATOR_CLI_ENV_VAR, previous);
      }
    }
  });
});
