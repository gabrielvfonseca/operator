/** Tests runtime loading and sorting for plugin web content extractors. */
import { describe, expect, it } from "vitest";
import { resolvePluginWebContentExtractors } from "../../src/plugins/web-content-extractors.runtime.js";

describe("resolvePluginWebContentExtractors", () => {
  it("respects global plugin disablement", () => {
    expect(
      resolvePluginWebContentExtractors({
        config: {
          plugins: {
            enabled: false,
          },
        },
      }),
    ).toStrictEqual([]);
  });
});
