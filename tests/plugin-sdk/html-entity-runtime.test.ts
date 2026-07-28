import { describe, expect, it } from "vitest";
import { decodeHtmlEntities } from "../../src/plugin-sdk/html-entity-runtime.js";

describe("decodeHtmlEntities", () => {
  it("exposes single-pass HTML5 decoding to plugins", () => {
    expect(decodeHtmlEntities("&copy; &amp;lt; &#128512; &#xD800;")).toBe("© &lt; 😀 &#xD800;");
  });
});
