// Built-in Operator harness tests cover logical thinking-mode boundaries.
import { beforeEach, describe, expect, it, vi } from "vitest";

const runEmbeddedAttempt = vi.hoisted(() => vi.fn());

vi.mock("../embedded-agent-runner/run/attempt.js", () => ({ runEmbeddedAttempt }));

import { createOperatorAgentHarness } from "./builtin-openclaw.js";

describe("createOperatorAgentHarness", () => {
  beforeEach(() => {
    runEmbeddedAttempt.mockReset();
    runEmbeddedAttempt.mockResolvedValue({});
  });

  it("preserves logical Ultra for the embedded attempt", async () => {
    const params = { thinkLevel: "ultra" } as never;

    await createOperatorAgentHarness().runAttempt(params);

    expect(runEmbeddedAttempt).toHaveBeenCalledWith(params);
  });
});
