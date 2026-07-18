import { describe, expect, it } from "vitest";
import {
  assertPreparedOperatorNpmShrinkwrap,
  prepareOperatorNpmShrinkwrap,
} from "../../scripts/prepare-operator-npm-shrinkwrap.ts";

const AI_DEPENDENCIES = {
  "@anthropic-ai/sdk": "0.109.1",
  openai: "6.45.0",
};

type ShrinkwrapPackage = Record<string, unknown> & {
  dependencies?: Record<string, string>;
  name?: string;
  version?: string;
};

function createShrinkwrap(): {
  lockfileVersion: number;
  packages: Record<string, ShrinkwrapPackage>;
} {
  return {
    lockfileVersion: 3,
    packages: {
      "": {
        name: "@gabrielvfonseca/operator",
        version: "2026.7.1-beta.5",
        dependencies: {
          openai: "6.45.0",
        },
      },
      "node_modules/@anthropic-ai/sdk": {
        version: "0.109.1",
      },
      "node_modules/openai": {
        version: "6.45.0",
      },
    },
  };
}

describe("prepareOperatorNpmShrinkwrap", () => {
  it("adds the exact registry AI runtime dependency to the root shrinkwrap", () => {
    const prepared = prepareOperatorNpmShrinkwrap({
      aiIntegrity: "sha512-test",
      aiManifest: {
        name: "@gabrielvfonseca/ai",
        version: "2026.7.1-beta.5",
        license: "MIT",
        engines: { node: ">=22.19.0" },
        dependencies: AI_DEPENDENCIES,
      },
      rootManifest: {
        name: "@gabrielvfonseca/operator",
        version: "2026.7.1-beta.5",
      },
      shrinkwrap: createShrinkwrap(),
    });

    expect(prepared.packages?.[""]?.dependencies).toEqual({
      "@gabrielvfonseca/ai": "2026.7.1-beta.5",
      openai: "6.45.0",
    });
    expect(prepared.packages?.["node_modules/@gabrielvfonseca/ai"]).toEqual({
      version: "2026.7.1-beta.5",
      resolved: "https://registry.npmjs.org/@gabrielvfonseca/ai/-/ai-2026.7.1-beta.5.tgz",
      integrity: "sha512-test",
      license: "MIT",
      dependencies: AI_DEPENDENCIES,
      engines: { node: ">=22.19.0" },
    });
    expect(() =>
      assertPreparedOperatorNpmShrinkwrap({
        aiIntegrity: "sha512-test",
        aiManifest: {
          name: "@gabrielvfonseca/ai",
          version: "2026.7.1-beta.5",
          license: "MIT",
          engines: { node: ">=22.19.0" },
          dependencies: AI_DEPENDENCIES,
        },
        rootManifest: {
          name: "@gabrielvfonseca/operator",
          version: "2026.7.1-beta.5",
          dependencies: { "@gabrielvfonseca/ai": "2026.7.1-beta.5" },
        },
        shrinkwrap: prepared,
      }),
    ).not.toThrow();
  });

  it("rejects mismatched versions and incomplete dependency graphs", () => {
    expect(() =>
      prepareOperatorNpmShrinkwrap({
        aiIntegrity: "sha512-test",
        aiManifest: {
          name: "@gabrielvfonseca/ai",
          version: "2026.7.1-beta.4",
          dependencies: AI_DEPENDENCIES,
        },
        rootManifest: {
          name: "@gabrielvfonseca/operator",
          version: "2026.7.1-beta.5",
        },
        shrinkwrap: createShrinkwrap(),
      }),
    ).toThrow("does not match Operator");

    const incomplete = createShrinkwrap();
    Reflect.deleteProperty(incomplete.packages, "node_modules/openai");
    expect(() =>
      prepareOperatorNpmShrinkwrap({
        aiIntegrity: "sha512-test",
        aiManifest: {
          name: "@gabrielvfonseca/ai",
          version: "2026.7.1-beta.5",
          dependencies: AI_DEPENDENCIES,
        },
        rootManifest: {
          name: "@gabrielvfonseca/operator",
          version: "2026.7.1-beta.5",
        },
        shrinkwrap: incomplete,
      }),
    ).toThrow("missing AI runtime dependency openai");

    const stale = createShrinkwrap();
    stale.packages["node_modules/openai"] = { version: "6.44.0" };
    expect(() =>
      prepareOperatorNpmShrinkwrap({
        aiIntegrity: "sha512-test",
        aiManifest: {
          name: "@gabrielvfonseca/ai",
          version: "2026.7.1-beta.5",
          dependencies: AI_DEPENDENCIES,
        },
        rootManifest: {
          name: "@gabrielvfonseca/operator",
          version: "2026.7.1-beta.5",
        },
        shrinkwrap: stale,
      }),
    ).toThrow("openai@6.44.0 does not satisfy 6.45.0");

    expect(() =>
      assertPreparedOperatorNpmShrinkwrap({
        aiIntegrity: "sha512-test",
        aiManifest: {
          name: "@gabrielvfonseca/ai",
          version: "2026.7.1-beta.5",
          dependencies: AI_DEPENDENCIES,
        },
        rootManifest: {
          name: "@gabrielvfonseca/operator",
          version: "2026.7.1-beta.5",
          dependencies: { "@gabrielvfonseca/ai": "2026.7.1-beta.5" },
        },
        shrinkwrap: createShrinkwrap(),
      }),
    ).toThrow("does not lock the exact @gabrielvfonseca/ai tarball");

    const prepared = prepareOperatorNpmShrinkwrap({
      aiIntegrity: "sha512-test",
      aiManifest: {
        name: "@gabrielvfonseca/ai",
        version: "2026.7.1-beta.5",
        dependencies: AI_DEPENDENCIES,
      },
      rootManifest: {
        name: "@gabrielvfonseca/operator",
        version: "2026.7.1-beta.5",
      },
      shrinkwrap: createShrinkwrap(),
    });
    expect(() =>
      assertPreparedOperatorNpmShrinkwrap({
        aiIntegrity: "sha512-test",
        aiManifest: {
          name: "@gabrielvfonseca/ai",
          version: "2026.7.1-beta.5",
          dependencies: AI_DEPENDENCIES,
        },
        rootManifest: {
          name: "@gabrielvfonseca/operator",
          version: "2026.7.1-beta.5",
        },
        shrinkwrap: prepared,
      }),
    ).toThrow("packed Operator manifest must depend on exact @gabrielvfonseca/ai");
  });

  it("validates semver ranges and rejects unsupported dependency specs", () => {
    const shrinkwrap = createShrinkwrap();
    shrinkwrap.packages["node_modules/ranged"] = { version: "2.4.1" };
    shrinkwrap.packages["node_modules/aliased"] = { version: "3.2.0" };

    expect(() =>
      prepareOperatorNpmShrinkwrap({
        aiIntegrity: "sha512-test",
        aiManifest: {
          name: "@gabrielvfonseca/ai",
          version: "2026.7.1-beta.5",
          dependencies: {
            ranged: "^2.4.0",
          },
        },
        rootManifest: {
          name: "@gabrielvfonseca/operator",
          version: "2026.7.1-beta.5",
        },
        shrinkwrap,
      }),
    ).not.toThrow();

    expect(() =>
      prepareOperatorNpmShrinkwrap({
        aiIntegrity: "sha512-test",
        aiManifest: {
          name: "@gabrielvfonseca/ai",
          version: "2026.7.1-beta.5",
          dependencies: { aliased: "npm:@scope/real-package@~3.2.0" },
        },
        rootManifest: {
          name: "@gabrielvfonseca/operator",
          version: "2026.7.1-beta.5",
        },
        shrinkwrap,
      }),
    ).toThrow("aliased dependency must use a registry semver spec");

    shrinkwrap.packages["node_modules/ranged"].version = "2.5.0-beta.1";
    expect(() =>
      prepareOperatorNpmShrinkwrap({
        aiIntegrity: "sha512-test",
        aiManifest: {
          name: "@gabrielvfonseca/ai",
          version: "2026.7.1-beta.5",
          dependencies: { ranged: "^2.4.0" },
        },
        rootManifest: {
          name: "@gabrielvfonseca/operator",
          version: "2026.7.1-beta.5",
        },
        shrinkwrap,
      }),
    ).toThrow("ranged@2.5.0-beta.1 does not satisfy ^2.4.0");

    expect(() =>
      prepareOperatorNpmShrinkwrap({
        aiIntegrity: "sha512-test",
        aiManifest: {
          name: "@gabrielvfonseca/ai",
          version: "2026.7.1-beta.5",
          dependencies: { ranged: "workspace:*" },
        },
        rootManifest: {
          name: "@gabrielvfonseca/operator",
          version: "2026.7.1-beta.5",
        },
        shrinkwrap,
      }),
    ).toThrow("ranged dependency must use a registry semver spec");
  });
});
