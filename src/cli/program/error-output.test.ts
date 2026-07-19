// Error output tests cover program-level error display and exit messaging.
import { describe, expect, it } from "vitest";
import { formatCliParseErrorOutput } from "./error-output.js";

describe("formatCliParseErrorOutput", () => {
  it("explains unknown commands with root help and plugin hints", () => {
    const output = formatCliParseErrorOutput("error: unknown command 'wat'\n", {
      argv: ["node", "@gabrielvfonseca/operator", "wat"],
    });

    expect(output).toBe(
      'Operator does not know the command "wat".\nTry: openclaw --help\nPlugin command? openclaw plugins list\nDocs: https://docs.operator.ai/cli\n',
    );
  });

  it("suggests close known commands for unknown commands", () => {
    const output = formatCliParseErrorOutput("error: unknown command 'upate'\n", {
      argv: ["node", "@gabrielvfonseca/operator", "upate"],
    });

    expect(output).toBe(
      'Operator does not know the command "upate".\nDid you mean this?\n  openclaw update\nTry: openclaw --help\nPlugin command? openclaw plugins list\nDocs: https://docs.operator.ai/cli\n',
    );
  });

  it("suggests explicit aliases for common adjacent terminology", () => {
    const output = formatCliParseErrorOutput("error: unknown command 'upgrade'\n", {
      argv: ["node", "@gabrielvfonseca/operator", "upgrade"],
    });

    expect(output).toContain("Did you mean this?\n  openclaw update\n");
  });

  it("preserves active profile context in command suggestions", () => {
    const originalProfile = process.env.OPERATOR_PROFILE;
    process.env.OPERATOR_PROFILE = "work";
    try {
      const output = formatCliParseErrorOutput("error: unknown command 'doctr'\n", {
        argv: ["node", "@gabrielvfonseca/operator", "doctr"],
      });

      expect(output).toContain("Did you mean this?\n  openclaw --profile work doctor\n");
    } finally {
      if (originalProfile === undefined) {
        delete process.env.OPERATOR_PROFILE;
      } else {
        process.env.OPERATOR_PROFILE = originalProfile;
      }
    }
  });

  it("points unknown options at the active command help", () => {
    const output = formatCliParseErrorOutput("error: unknown option '--wat'\n", {
      argv: ["node", "@gabrielvfonseca/operator", "channels", "status", "--wat"],
    });

    expect(output).toBe(
      'Operator does not recognize option "--wat".\nTry: openclaw channels status --help\n',
    );
  });

  it("points missing required arguments at command help", () => {
    const output = formatCliParseErrorOutput("error: missing required argument 'name'\n", {
      argv: ["node", "@gabrielvfonseca/operator", "plugins", "install"],
    });

    expect(output).toBe(
      'Missing ...
    );
  });
});
