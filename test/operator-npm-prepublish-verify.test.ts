import { describe, expect, it } from "vitest";
import {
  operatorNpmPrepublishVerifyUsage,
  parseOperatorNpmPrepublishVerifyArgs,
  usesPreparedLocalDependencyInstall,
} from "../scripts/operator-npm-prepublish-verify.ts";

describe("parseOperatorNpmPrepublishVerifyArgs", () => {
  it("supports help, optional versions, and package-manager separators", () => {
    expect(parseOperatorNpmPrepublishVerifyArgs(["--help"])).toEqual({
      dependencyTarballPaths: [],
      help: true,
      tarballPath: "",
    });
    expect(parseOperatorNpmPrepublishVerifyArgs(["operator.tgz"])).toEqual({
      dependencyTarballPaths: [],
      help: false,
      tarballPath: "operator.tgz",
    });
    expect(parseOperatorNpmPrepublishVerifyArgs(["--", "operator.tgz", "2026.3.23"])).toEqual({
      dependencyTarballPaths: [],
      expectedVersion: "2026.3.23",
      help: false,
      tarballPath: "operator.tgz",
    });
  });

  it("rejects missing, option-like, and extra arguments before installing", () => {
    expect(() => parseOperatorNpmPrepublishVerifyArgs([])).toThrow(
      operatorNpmPrepublishVerifyUsage(),
    );
    expect(() => parseOperatorNpmPrepublishVerifyArgs(["--tag"])).toThrow(
      "Unknown operator npm prepublish verifier option: --tag",
    );
    expect(() => parseOperatorNpmPrepublishVerifyArgs(["operator.tgz", "--tag"])).toThrow(
      "Unknown operator npm prepublish verifier option: --tag",
    );
    expect(
      parseOperatorNpmPrepublishVerifyArgs(["operator.tgz", "2026.3.23", "llm-core.tgz", "ai.tgz"]),
    ).toEqual({
      dependencyTarballPaths: ["llm-core.tgz", "ai.tgz"],
      expectedVersion: "2026.3.23",
      help: false,
      tarballPath: "operator.tgz",
    });
    expect(() =>
      parseOperatorNpmPrepublishVerifyArgs(["operator.tgz", "2026.3.23", "--bad"]),
    ).toThrow("Invalid dependency tarball path: --bad");
  });
});

describe("usesPreparedLocalDependencyInstall", () => {
  it("uses the prepared local project only for the single AI tarball release path", () => {
    expect(usesPreparedLocalDependencyInstall(0)).toBe(false);
    expect(usesPreparedLocalDependencyInstall(1)).toBe(true);
    expect(usesPreparedLocalDependencyInstall(2)).toBe(false);
  });
});
