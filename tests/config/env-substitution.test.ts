// Covers config environment-variable substitution behavior.
import { describe, expect, it } from "vitest";
import {
  type EnvSubstitutionWarning,
  MissingEnvVarError,
  containsEnvVarReference,
  resolveConfigEnvVars,
} from "../../src/config/env-substitution.js";

type SubstitutionScenario = {
  name: string;
  config: unknown;
  env: Record<string, string>;
  expected: unknown;
};

type MissingEnvScenario = {
  name: string;
  config: unknown;
  env: Record<string, string>;
  varName: string;
  configPath: string;
};

function expectResolvedScenarios(scenarios: SubstitutionScenario[]) {
  for (const scenario of scenarios) {
    const result = resolveConfigEnvVars(scenario.config, scenario.env);
    expect(result, scenario.name).toEqual(scenario.expected);
  }
}

function expectMissingScenarios(scenarios: MissingEnvScenario[]) {
  for (const scenario of scenarios) {
    try {
      resolveConfigEnvVars(scenario.config, scenario.env);
      expect.fail(`${scenario.name}: expected MissingEnvVarError`);
    } catch (err) {
      expect(err, scenario.name).toBeInstanceOf(MissingEnvVarError);
      const error = err as MissingEnvVarError;
      expect(error.varName, scenario.name).toBe(scenario.varName);
      expect(error.configPath, scenario.name).toBe(scenario.configPath);
    }
  }
}

describe("resolveConfigEnvVars", () => {
  describe("basic substitution", () => {
    it("substitutes direct, inline, repeated, and multi-var patterns", () => {
      const scenarios: SubstitutionScenario[] = [
        {
          name: "single env var",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${FOO}" },
          env: { FOO: "bar" },
          expected: { key: "bar" },
        },
        {
          name: "multiple env vars in same string",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${A}/${B}" },
          env: { A: "x", B: "y" },
          expected: { key: "x/y" },
        },
        {
          name: "inline prefix/suffix",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "prefix-${FOO}-suffix" },
          env: { FOO: "bar" },
          expected: { key: "prefix-bar-suffix" },
        },
        {
          name: "same var repeated",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${FOO}:${FOO}" },
          env: { FOO: "bar" },
          expected: { key: "bar:bar" },
        },
      ];

      expectResolvedScenarios(scenarios);
    });
  });

  describe("nested structures", () => {
    it("substitutes variables in nested objects and arrays", () => {
      const scenarios: SubstitutionScenario[] = [
        {
          name: "nested object",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { outer: { inner: { key: "${API_KEY}" } } },
          env: { API_KEY: "secret123" },
          expected: { outer: { inner: { key: "secret123" } } },
        },
        {
          name: "flat array",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { items: ["${A}", "${B}", "${C}"] },
          env: { A: "1", B: "2", C: "3" },
          expected: { items: ["1", "2", "3"] },
        },
        {
          name: "array of objects",
          config: {
            providers: [
              // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
              { name: "openai", apiKey: "${OPENAI_KEY}" },
              // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
              { name: "anthropic", apiKey: "${ANTHROPIC_KEY}" },
            ],
          },
          env: { OPENAI_KEY: "sk-xxx", ANTHROPIC_KEY: "sk-yyy" },
          expected: {
            providers: [
              { name: "openai", apiKey: "sk-xxx" },
              { name: "anthropic", apiKey: "sk-yyy" },
            ],
          },
        },
      ];

      expectResolvedScenarios(scenarios);
    });
  });

  describe("missing env var handling", () => {
    it("throws MissingEnvVarError with var name and config path details", () => {
      const scenarios: MissingEnvScenario[] = [
        {
          name: "missing top-level var",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${MISSING}" },
          env: {},
          varName: "MISSING",
          configPath: "key",
        },
        {
          name: "missing nested var",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { outer: { inner: { key: "${MISSING_VAR}" } } },
          env: {},
          varName: "MISSING_VAR",
          configPath: "outer.inner.key",
        },
        {
          name: "missing var in array element",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { items: ["ok", "${MISSING}"] },
          env: { OK: "val" },
          varName: "MISSING",
          configPath: "items[1]",
        },
        {
          name: "empty string env value treated as missing",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${EMPTY}" },
          env: { EMPTY: "" },
          varName: "EMPTY",
          configPath: "key",
        },
      ];

      expectMissingScenarios(scenarios);
    });
  });

  describe("escape syntax", () => {
    it("handles escaped placeholders alongside regular substitutions", () => {
      const scenarios: SubstitutionScenario[] = [
        {
          name: "escaped placeholder stays literal",
          config: { key: "$${VAR}" },
          env: { VAR: "value" },
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          expected: { key: "${VAR}" },
        },
        {
          name: "mix of escaped and unescaped vars",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${REAL}/$${LITERAL}" },
          env: { REAL: "resolved" },
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          expected: { key: "resolved/${LITERAL}" },
        },
        {
          name: "escaped first, unescaped second",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "$${FOO} ${FOO}" },
          env: { FOO: "bar" },
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          expected: { key: "${FOO} bar" },
        },
        {
          name: "unescaped first, escaped second",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${FOO} $${FOO}" },
          env: { FOO: "bar" },
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          expected: { key: "bar ${FOO}" },
        },
        {
          name: "multiple escaped placeholders",
          config: { key: "$${A}:$${B}" },
          env: {},
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          expected: { key: "${A}:${B}" },
        },
        {
          name: "env values are not unescaped",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${FOO}" },
          env: { FOO: "$${BAR}" },
          expected: { key: "$${BAR}" },
        },
      ];

      expectResolvedScenarios(scenarios);
    });
  });

  describe("pattern matching rules", () => {
    it("leaves non-matching placeholders unchanged", () => {
      const scenarios: SubstitutionScenario[] = [
        {
          name: "$VAR (no braces)",
          config: { key: "$VAR" },
          env: { VAR: "value" },
          expected: { key: "$VAR" },
        },
        {
          name: "lowercase placeholder",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${lowercase}" },
          env: { lowercase: "value" },
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          expected: { key: "${lowercase}" },
        },
        {
          name: "mixed-case placeholder",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${MixedCase}" },
          env: { MixedCase: "value" },
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          expected: { key: "${MixedCase}" },
        },
        {
          name: "invalid numeric prefix",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${123INVALID}" },
          env: {},
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          expected: { key: "${123INVALID}" },
        },
      ];

      expectResolvedScenarios(scenarios);
    });

    it("substitutes valid uppercase/underscore placeholder names", () => {
      const scenarios: SubstitutionScenario[] = [
        {
          name: "underscore-prefixed name",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${_UNDERSCORE_START}" },
          env: { _UNDERSCORE_START: "valid" },
          expected: { key: "valid" },
        },
        {
          name: "name with numbers",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { key: "${VAR_WITH_NUMBERS_123}" },
          env: { VAR_WITH_NUMBERS_123: "valid" },
          expected: { key: "valid" },
        },
      ];

      expectResolvedScenarios(scenarios);
    });
  });

  describe("passthrough behavior", () => {
    it("passes through primitives unchanged", () => {
      for (const value of ["hello", 42, true, null]) {
        expect(resolveConfigEnvVars(value, {})).toBe(value);
      }
    });

    it("preserves empty and non-string containers", () => {
      const scenarios: Array<{ config: unknown; expected: unknown }> = [
        { config: {}, expected: {} },
        { config: [], expected: [] },
        {
          config: { num: 42, bool: true, nil: null, arr: [1, 2] },
          expected: { num: 42, bool: true, nil: null, arr: [1, 2] },
        },
      ];

      for (const scenario of scenarios) {
        expect(resolveConfigEnvVars(scenario.config, {})).toEqual(scenario.expected);
      }
    });
  });

  describe("graceful missing env var handling (onMissing)", () => {
    it("collects warnings and preserves placeholder when onMissing is set", () => {
      const warnings: EnvSubstitutionWarning[] = [];
      const result = resolveConfigEnvVars(
        // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
        { key: "${MISSING_VAR}", present: "${PRESENT}" },
        { PRESENT: "ok" } as NodeJS.ProcessEnv,
        { onMissing: (w) => warnings.push(w) },
      );
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(result).toEqual({ key: "${MISSING_VAR}", present: "ok" });
      expect(warnings).toEqual([{ varName: "MISSING_VAR", configPath: "key" }]);
    });

    it("collects multiple warnings across nested paths", () => {
      const warnings: EnvSubstitutionWarning[] = [];
      const result = resolveConfigEnvVars(
        {
          providers: {
            // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
            tts: { apiKey: "${TTS_KEY}" },
            // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
            stt: { apiKey: "${STT_KEY}" },
          },
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          gateway: { token: "${GW_TOKEN}" },
        },
        { GW_TOKEN: "secret" } as NodeJS.ProcessEnv,
        { onMissing: (w) => warnings.push(w) },
      );
      expect(result).toEqual({
        providers: {
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          tts: { apiKey: "${TTS_KEY}" },
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          stt: { apiKey: "${STT_KEY}" },
        },
        gateway: { token: "secret" },
      });
      expect(warnings).toHaveLength(2);
      expect(warnings[0]).toEqual({ varName: "TTS_KEY", configPath: "providers.tts.apiKey" });
      expect(warnings[1]).toEqual({ varName: "STT_KEY", configPath: "providers.stt.apiKey" });
    });

    it("still throws when onMissing is not set", () => {
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(() => resolveConfigEnvVars({ key: "${MISSING}" }, {} as NodeJS.ProcessEnv)).toThrow(
        MissingEnvVarError,
      );
    });
  });

  describe("containsEnvVarReference", () => {
    it("detects unresolved env var placeholders", () => {
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(containsEnvVarReference("${FOO}")).toBe(true);
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(containsEnvVarReference("prefix-${VAR}-suffix")).toBe(true);
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(containsEnvVarReference("${A}/${B}")).toBe(true);
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(containsEnvVarReference("${_UNDERSCORE}")).toBe(true);
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(containsEnvVarReference("${VAR_WITH_123}")).toBe(true);
    });

    it("returns false for non-matching patterns", () => {
      expect(containsEnvVarReference("no-refs-here")).toBe(false);
      expect(containsEnvVarReference("$VAR")).toBe(false);
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(containsEnvVarReference("${lowercase}")).toBe(false);
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(containsEnvVarReference("${MixedCase}")).toBe(false);
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(containsEnvVarReference("${123INVALID}")).toBe(false);
      expect(containsEnvVarReference("")).toBe(false);
    });

    it("returns false for escaped placeholders", () => {
      expect(containsEnvVarReference("$${ESCAPED}")).toBe(false);
      expect(containsEnvVarReference("prefix-$${ESCAPED}-suffix")).toBe(false);
    });

    it("detects references mixed with escaped placeholders", () => {
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(containsEnvVarReference("$${ESCAPED} ${REAL}")).toBe(true);
      // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
      expect(containsEnvVarReference("${REAL} $${ESCAPED}")).toBe(true);
    });
  });

  describe("real-world config patterns", () => {
    it("substitutes provider, gateway, and base URL config values", () => {
      const scenarios: SubstitutionScenario[] = [
        {
          name: "provider API keys",
          config: {
            models: {
              providers: {
                // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
                "vercel-gateway": { apiKey: "${VERCEL_GATEWAY_API_KEY}" },
                // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
                openai: { apiKey: "${OPENAI_API_KEY}" },
              },
            },
          },
          env: {
            VERCEL_GATEWAY_API_KEY: "vg_key_123",
            OPENAI_API_KEY: "sk-xxx",
          },
          expected: {
            models: {
              providers: {
                "vercel-gateway": { apiKey: "vg_key_123" },
                openai: { apiKey: "sk-xxx" },
              },
            },
          },
        },
        {
          name: "gateway auth token",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
          config: { gateway: { auth: { token: "${OPERATOR_GATEWAY_TOKEN}" } } },
          env: { OPERATOR_GATEWAY_TOKEN: "secret-token" },
          expected: { gateway: { auth: { token: "secret-token" } } },
        },
        {
          name: "provider base URL composition",
          config: {
            models: {
              providers: {
                // biome-ignore lint/suspicious/noTemplateCurlyInString: migrated from oxlint
                custom: { baseUrl: "${CUSTOM_API_BASE}/v1" },
              },
            },
          },
          env: { CUSTOM_API_BASE: "https://api.example.com" },
          expected: {
            models: {
              providers: {
                custom: { baseUrl: "https://api.example.com/v1" },
              },
            },
          },
        },
      ];

      expectResolvedScenarios(scenarios);
    });
  });
});
