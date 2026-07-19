// Text format tests cover command-facing shortening helpers.
import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("@gabrielvfonseca/operator", 16)).toBe("@gabrielvfonseca/operator");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("operator-status-output", 10)).toBe("operator-…");
  });

  it("returns an empty string for non-positive limits", () => {
    expect(shortenText("@gabrielvfonseca/operator", 0)).toBe("");
    expect(shortenText("@gabrielvfonseca/operator", -1)).toBe("");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
