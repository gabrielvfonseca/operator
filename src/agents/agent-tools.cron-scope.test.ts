/**
 * Tests cron-triggered tool assembly.
 * Ensures cron runs scope cron tool behavior to self-removal of the current
 * job only.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnyAgentTool } from "./tools/common.js";

const mocks = vi.hoisted(() => {
  const stubTool = (name: string) =>
    ({
      name,
      label: name,
      displaySummary: name,
      description: name,
      parameters: { type: "object", properties: {} },
      execute: vi.fn(),
    }) satisfies AnyAgentTool;

  return {
    createOperatorToolsOptions: vi.fn(),
    stubTool,
  };
});

vi.mock("./openclaw-tools.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./openclaw-tools.js")>();
  return {
    createOperatorTools: (options: unknown) => {
      mocks.createOperatorToolsOptions(options);
      return [mocks.stubTool("cron")];
    },
    filterToolsByClientCaps: actual.filterToolsByClientCaps,
  };
});

import "./test-helpers/fast-bash-tools.js";
import "./test-helpers/fast-coding-tools.js";
import { createOperatorCodingTools } from "./agent-tools.js";

function firstOperatorToolsOptions(): { cronSelfRemoveOnlyJobId?: string } | undefined {
  return mocks.createOperatorToolsOptions.mock.calls[0]?.[0] as
    | { cronSelfRemoveOnlyJobId?: string }
    | undefined;
}

describe("createOperatorCodingTools cron scope", () => {
  beforeEach(() => {
    mocks.createOperatorToolsOptions.mockClear();
  });

  it("scopes cron-triggered jobs to self-removal", () => {
    const tools = createOperatorCodingTools({
      trigger: "cron",
      jobId: "job-current",
    });

    expect(tools.map((tool) => tool.name)).toContain("cron");
    expect(firstOperatorToolsOptions()?.cronSelfRemoveOnlyJobId).toBe("job-current");
  });

  it("does not scope non-cron sessions", () => {
    createOperatorCodingTools({
      trigger: "user",
      jobId: "job-current",
    });

    expect(firstOperatorToolsOptions()?.cronSelfRemoveOnlyJobId).toBeUndefined();
  });
});
