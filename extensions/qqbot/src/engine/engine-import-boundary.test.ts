/**
 * Engine import boundary test.
 *
 * Ensures that engine/ sources only import from `operator/plugin-sdk/*`
 * and never reach into other operator internals directly.
 */

import fs from "node:fs";
import path from "node:path";
import { expectDefined } from "@gabrielvfonseca/normalization-core";
import { describe, expect, it } from "vitest";

const ENGINE_DIR = path.resolve(import.meta.dirname);

/** Recursively collect all non-test .ts files under a directory. */
function walkSourceFiles(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }
      walkSourceFiles(fullPath, files);
      continue;
    }
    if (
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".spec.ts")
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Extract all `operator/...` import specifiers from source text.
 * Matches: import ... from "@gabrielvfonseca/operator/...", import("operator/...")
 */
function findOpenclawImports(source: string): string[] {
  return [
    ...source.matchAll(/from\s+["'](operator\/[^"']+)["']/g),
    ...source.matchAll(/import\(\s*["'](operator\/[^"']+)["']\s*\)/g),
  ].map((match) => expectDefined(match[1], "Operator import specifier"));
}

/** Check if an import specifier is an allowed operator/plugin-sdk subpath. */
const ALLOWED_PREFIX = ["@gabrielvfonseca/operator", "plugin-sdk"].join("/");
function isAllowedImport(specifier: string): boolean {
  return specifier.startsWith(ALLOWED_PREFIX);
}

describe("engine import boundary", () => {
  it("only imports from operator/plugin-sdk, never from other operator internals", () => {
    const sourceFiles = walkSourceFiles(ENGINE_DIR);
    const offenders: Array<{ file: string; imports: string[] }> = [];

    for (const file of sourceFiles) {
      const source = fs.readFileSync(file, "utf8");
      const operatorImports = findOpenclawImports(source);
      const forbidden = operatorImports.filter((specifier) => !isAllowedImport(specifier));

      if (forbidden.length > 0) {
        offenders.push({
          file: path.relative(ENGINE_DIR, file),
          imports: forbidden,
        });
      }
    }

    expect(offenders).toStrictEqual([]);
  });
});
