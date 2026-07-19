// Frontmatter tests cover shared Markdown frontmatter parsing helpers.
import { describe, expect, it, test } from "vitest";
import {
  applyOperatorManifestInstallCommonFields,
  getFrontmatterString,
  normalizeStringList,
  parseFrontmatterBool,
  parseOperatorManifestInstallBase,
  resolveOperatorManifestBlock,
  resolveOperatorManifestInstall,
  resolveOperatorManifestOs,
  resolveOperatorManifestRequires,
} from "./frontmatter.js";

function expectInstallBase(
  parsed: ReturnType<typeof parseOperatorManifestInstallBase>,
): NonNullable<ReturnType<typeof parseOperatorManifestInstallBase>> {
  if (parsed === undefined) {
    throw new Error("Expected manifest install base");
  }
  return parsed;
}

describe("shared/frontmatter", () => {
  test("normalizeStringList handles strings, arrays, and non-list values", () => {
    expect(normalizeStringList("a, b,,c")).toEqual(["a", "b", "c"]);
    expect(normalizeStringList([" a ", "", "b", 42])).toEqual(["a", "b", "42"]);
    expect(normalizeStringList(null)).toStrictEqual([]);
  });

  test("getFrontmatterString extracts strings only", () => {
    expect(getFrontmatterString({ a: "b" }, "a")).toBe("b");
    expect(getFrontmatterString({ a: 1 }, "a")).toBeUndefined();
  });

  test("parseFrontmatterBool respects explicit values and fallback", () => {
    expect(parseFrontmatterBool("true", false)).toBe(true);
    expect(parseFrontmatterBool("false", true)).toBe(false);
    expect(parseFrontmatterBool(undefined, true)).toBe(true);
    expect(parseFrontmatterBool("maybe", false)).toBe(false);
  });

  test("resolveOperatorManifestBlock reads current manifest keys and custom metadata fields", () => {
    expect(
      resolveOperatorManifestBlock({
        frontmatter: {
          metadata: "{ operator: { foo: 1, bar: 'baz' } }",
        },
      }),
    ).toEqual({ foo: 1, bar: "baz" });

    expect(
      resolveOperatorManifestBlock({
        frontmatter: {
          pluginMeta: "{ operator: { foo: 2 } }",
        },
        key: "pluginMeta",
      }),
    ).toEqual({ foo: 2 });
  });

  test("resolveOperatorManifestBlock reads legacy manifest keys", () => {
    expect(
      resolveOperatorManifestBlock({
        frontmatter: {
          metadata: "{ clawdbot: { requires: { bins: ['op'] }, install: [] } }",
        },
      }),
    ).toEqual({ requires: { bins: ["op"] }, install: [] });
  });

  test("resolveOperatorManifestBlock prefers current manifest keys over legacy keys", () => {
    expect(
      resolveOperatorManifestBlock({
        frontmatter: {
          metadata:
            "{ operator: { requires: { bins: ['current'] } }, clawdbot: { requires: { bins: ['legacy'] } } }",
        },
      }),
    ).toEqual({ requires: { bins: ["current"] } });
  });

  test("resolveOperatorManifestBlock returns undefined for invalid input", () => {
    expect(resolveOperatorManifestBlock({ frontmatter: {} })).toBeUndefined();
    expect(
      resolveOperatorManifestBlock({ frontmatter: { metadata: "not-json5" } }),
    ).toBeUndefined();
    expect(resolveOperatorManifestBlock({ frontmatter: { metadata: "123" } })).toBeUndefined();
    expect(resolveOperatorManifestBlock({ frontmatter: { metadata: "[]" } })).toBeUndefined();
    expect(
      resolveOperatorManifestBlock({ frontmatter: { metadata: "{ nope: { a: 1 } }" } }),
    ).toBeUndefined();
  });

  it("normalizes manifest requirement and os lists", () => {
    expect(
      resolveOperatorManifestRequires({
        requires: {
          bins: "bun, node",
          anyBins: [" ffmpeg ", ""],
          env: ["OPERATOR_TOKEN", " OPERATOR_URL "],
          config: null,
        },
      }),
    ).toEqual({
      bins: ["bun", "node"],
      anyBins: ["ffmpeg"],
      env: ["OPERATOR_TOKEN", "OPERATOR_URL"],
      config: [],
    });
    expect(resolveOperatorManifestRequires({})).toBeUndefined();
    expect(resolveOperatorManifestOs({ os: [" darwin ", "linux", ""] })).toEqual([
      "darwin",
      "linux",
    ]);
  });

  it("parses and applies install common fields", () => {
    const parsed = parseOperatorManifestInstallBase(
      {
        type: " Brew ",
        id: "brew.git",
        label: "Git",
        bins: [" git ", "git"],
      },
      ["brew", "npm"],
    );

    expect(parsed).toEqual({
      raw: {
        type: " Brew ",
        id: "brew.git",
        label: "Git",
        bins: [" git ", "git"],
      },
      kind: "brew",
      id: "brew.git",
      label: "Git",
      bins: ["git", "git"],
    });
    expect(parseOperatorManifestInstallBase({ kind: "bad" }, ["brew"])).toBeUndefined();
    expect(
      applyOperatorManifestInstallCommonFields<{
        extra: boolean;
        id?: string;
        label?: string;
        bins?: string[];
      }>({ extra: true }, expectInstallBase(parsed)),
    ).toEqual({
      extra: true,
      id: "brew.git",
      label: "Git",
      bins: ["git", "git"],
    });
  });

  it("prefers explicit kind, ignores invalid common fields, and leaves missing ones untouched", () => {
    const parsed = parseOperatorManifestInstallBase(
      {
        kind: " npm ",
        type: "brew",
        id: 42,
        label: null,
        bins: [" ", ""],
      },
      ["brew", "npm"],
    );

    expect(parsed).toEqual({
      raw: {
        kind: " npm ",
        type: "brew",
        id: 42,
        label: null,
        bins: [" ", ""],
      },
      kind: "npm",
    });
    expect(
      applyOperatorManifestInstallCommonFields(
        { id: "keep", label: "Keep", bins: ["bun"] },
        parsed!,
      ),
    ).toEqual({
      id: "keep",
      label: "Keep",
      bins: ["bun"],
    });
  });

  it("maps install entries through the parser and filters rejected specs", () => {
    expect(
      resolveOperatorManifestInstall(
        {
          install: [{ id: "keep" }, { id: "drop" }, "bad"],
        },
        (entry) => {
          if (
            typeof entry === "object" &&
            entry !== null &&
            (entry as { id?: string }).id === "keep"
          ) {
            return { id: "keep" };
          }
          return undefined;
        },
      ),
    ).toEqual([{ id: "keep" }]);
  });
});
