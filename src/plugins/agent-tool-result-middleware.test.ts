// Covers plugin middleware that can transform agent tool results.
import { describe, expect, it } from "vitest";
import { normalizeAgentToolResultMiddlewareRuntimes } from "./agent-tool-result-middleware.js";

describe("normalizeAgentToolResultMiddlewareRuntimes", () => {
  it("defaults omitted runtimes to every supported runtime", () => {
    expect(normalizeAgentToolResultMiddlewareRuntimes()).toEqual([
      "@gabrielvfonseca/operator",
      "codex",
    ]);
  });

  it("preserves an explicit empty runtime list", () => {
    expect(normalizeAgentToolResultMiddlewareRuntimes({ runtimes: [] })).toEqual([]);
  });

  it("normalizes legacy harness names", () => {
    expect(
      normalizeAgentToolResultMiddlewareRuntimes({
        harnesses: ["codex-app-server", "@gabrielvfonseca/operator"],
      }),
    ).toEqual(["codex", "@gabrielvfonseca/operator"]);
  });

  it("falls back to legacy harnesses when runtimes is undefined", () => {
    expect(
      normalizeAgentToolResultMiddlewareRuntimes({
        runtimes: undefined,
        harnesses: ["codex-app-server"],
      }),
    ).toEqual(["codex"]);
  });
});
