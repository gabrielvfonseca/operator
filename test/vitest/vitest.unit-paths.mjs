// Unit test routing globs and boundary/bundled-plugin exclusions.
import path from "node:path";
import { BUNDLED_PLUGIN_ROOT_DIR } from "../../scripts/lib/bundled-plugin-paths.mjs";

export const unitTestIncludePatterns = [
  "tests/**/*.test.ts",
  "packages/**/*.test.ts",
  "test/**/*.test.ts",
];

export const boundaryTestFiles = [
  "tests/infra/boundary-path.test.ts",
  "tests/infra/git-root.test.ts",
  "tests/infra/home-dir.test.ts",
  "tests/infra/operator-exec-env.test.ts",
  "tests/infra/operator-root.test.ts",
  "tests/infra/package-json.test.ts",
  "tests/infra/path-env.test.ts",
  "tests/infra/stable-node-path.test.ts",
  "test/extension-import-boundaries.test.ts",
  "test/extension-test-boundary.test.ts",
  "test/plugin-extension-import-boundary.test.ts",
  "test/web-provider-boundary.test.ts",
];

export const bundledPluginDependentUnitTestFiles = [
  "tests/infra/matrix-plugin-helper.test.ts",
  "tests/plugin-sdk/facade-runtime.test.ts",
  "tests/plugins/loader.test.ts",
];

export const unitTestAdditionalExcludePatterns = [
  "tests/gateway/**",
  "packages/gateway-client/**",
  "packages/gateway-protocol/**",
  "tests/hooks/**",
  "tests/infra/**",
  `${BUNDLED_PLUGIN_ROOT_DIR}/**`,
  "tests/browser/**",
  "tests/line/**",
  "tests/agents/**",
  "tests/auto-reply/**",
  "tests/channels/**",
  "tests/cli/**",
  "tests/commands/**",
  "tests/config/**",
  "tests/cron/**",
  "tests/daemon/**",
  "tests/media/**",
  "tests/plugin-sdk/**",
  "tests/plugins/**",
  "tests/process/**",
  "tests/secrets/**",
  "tests/shared/**",
  "tests/tasks/**",
  "tests/media-understanding/**",
  "tests/logging/**",
  "tests/tui/**",
  "tests/utils/**",
  "tests/wizard/**",
  "tests/plugins/contracts/**",
  "tests/scripts/**",
  "tests/infra/boundary-path.test.ts",
  "tests/infra/git-root.test.ts",
  "tests/infra/home-dir.test.ts",
  "tests/infra/operator-exec-env.test.ts",
  "tests/infra/operator-root.test.ts",
  "tests/infra/package-json.test.ts",
  "tests/infra/path-env.test.ts",
  "tests/infra/stable-node-path.test.ts",
  ...bundledPluginDependentUnitTestFiles,
  "tests/config/doc-baseline.integration.test.ts",
  "tests/config/schema.base.generated.test.ts",
  "tests/config/schema.help.quality.test.ts",
  "test/**",
];

const sharedBaseExcludePatterns = [
  "dist/**",
  "apps/macos/**",
  "apps/macos/.build/**",
  "**/node_modules/**",
  "**/vendor/**",
  "dist/Operator.app/**",
  "**/*.live.test.ts",
  "**/*.e2e.test.ts",
];

const normalizeRepoPath = (value) => value.split(path.sep).join("/");

const matchesAny = (file, patterns) => patterns.some((pattern) => path.matchesGlob(file, pattern));

export function isUnitConfigTestFile(file) {
  const normalizedFile = normalizeRepoPath(file);
  return (
    matchesAny(normalizedFile, unitTestIncludePatterns) &&
    !matchesAny(normalizedFile, sharedBaseExcludePatterns) &&
    !matchesAny(normalizedFile, unitTestAdditionalExcludePatterns)
  );
}

export function isBundledPluginDependentUnitTestFile(file) {
  return bundledPluginDependentUnitTestFiles.includes(normalizeRepoPath(file));
}

export function isBoundaryTestFile(file) {
  return boundaryTestFiles.includes(normalizeRepoPath(file));
}
