// Agent Core tests cover prompt templates behavior.
import { describe, expect, it } from "vitest";
import { parseCommandArgs, substituteArgs } from "./prompt-template-arguments.js";

describe("prompt template argument substitution", () => {
  it("parses quoted and multiline arguments", () => {
    expect(parseCommandArgs(`alpha "beta gamma"\ndelta 'echo one two'`)).toEqual([
      "alpha",
      "beta gamma",
      "delta",
      "echo one two",
    ]);
  });

  it("rejects unsafe positional placeholders", () => {
    expect(substituteArgs("$9007199254740992", ["first", "second"])).toBe("");
  });

  it("rejects unsafe slice starts and lengths", () => {
    const args = ["alpha", "beta", "gamma"];

    // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
    expect(substituteArgs("${@:9007199254740992}", args)).toBe("");
    // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
    expect(substituteArgs("${@:1:9007199254740992}", args)).toBe("");
  });

  it("preserves zero slice compatibility", () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
    expect(substituteArgs("${@:0:0}", ["alpha", "beta"])).toBe("");
    // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
    expect(substituteArgs("${@:0:1}", ["alpha", "beta"])).toBe("alpha");
  });
});
