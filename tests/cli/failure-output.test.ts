// Failure output tests cover CLI error formatting and failure summaries.
import { describe, expect, it } from "vitest";
import { formatCliFailureLines } from "../../src/cli/failure-output.js";

describe("formatCliFailureLines", () => {
  it("shows a concise reason and recovery commands by default", () => {
    const lines = formatCliFailureLines({
      title: "Could not start the CLI.",
      error: new Error("config file is invalid"),
      argv: ["node", "@gabrielvfonseca/operator", "status"],
      env: {},
    });

    expect(lines).toEqual([
      "[operator] Could not start the CLI.",
      "[operator] Reason: config file is invalid",
      "[operator] Debug: set OPERATOR_DEBUG=1 to include the stack trace.",
      "[operator] Try: operator doctor",
      "[operator] Help: operator --help",
    ]);
  });

  it("prints stack details when debug output is requested", () => {
    const lines = formatCliFailureLines({
      title: "The CLI command failed.",
      error: new Error("boom"),
      env: { OPERATOR_DEBUG: "1" },
    });

    expect(lines.slice(0, 4)).toEqual([
      "[operator] The CLI command failed.",
      "[operator] Reason: boom",
      "[operator] Stack:",
      "[operator] Error: boom",
    ]);
    expect(lines.join("\n")).toContain("Error: boom");
  });
});
