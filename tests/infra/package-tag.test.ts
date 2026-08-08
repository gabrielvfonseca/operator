// Tests package tag parsing and stable release tag behavior.
import { describe, expect, it } from "vitest";
import { normalizePackageTagInput } from "../../src/infra/package-tag.js";

describe("normalizePackageTagInput", () => {
  const packageNames = ["@gabrielvfonseca/operator", "@gabrielvfonseca/plugin"] as const;

  it.each([
    { input: undefined, expected: null },
    { input: "   ", expected: null },
    { input: "operator@beta", expected: "beta" },
    { input: "@gabrielvfonseca/plugin@2026.2.24", expected: "2026.2.24" },
    { input: "operator@   ", expected: null },
    { input: "@gabrielvfonseca/operator", expected: null },
    { input: " @gabrielvfonseca/plugin ", expected: null },
    { input: " latest ", expected: "latest" },
    { input: "@other/plugin@beta", expected: "@other/plugin@beta" },
    { input: "operatorer@beta", expected: "operatorer@beta" },
  ] satisfies ReadonlyArray<{ input: string | undefined; expected: string | null }>)(
    "normalizes %j",
    ({ input, expected }) => {
      expect(normalizePackageTagInput(input, packageNames)).toBe(expected);
    },
  );
});
