/**
 * Tests agent directory compatibility helpers.
 */
import { describe, expect, it } from "vitest";
import { resolveOperatorAgentDir } from "./agent-dir-compat.js";

describe("resolveOperatorAgentDir", () => {
  it("keeps the shipped Pi env alias for deprecated plugin SDK callers", () => {
    expect(
      resolveOperatorAgentDir({
        PI_CODING_AGENT_DIR: "/tmp/openclaw-legacy-agent",
      }),
    ).toBe("/tmp/openclaw-legacy-agent");
  });

  it("prefers the Operator env override over the deprecated Pi alias", () => {
    expect(
      resolveOperatorAgentDir({
        OPERATOR_AGENT_DIR: "/tmp/openclaw-agent",
        PI_CODING_AGENT_DIR: "/tmp/openclaw-legacy-agent",
      }),
    ).toBe("/tmp/openclaw-agent");
  });
});
