// Test routing map for lightweight plugin SDK tests and source triggers.
const normalizeRepoPath = (value) => value.replaceAll("\\", "/");

const pluginSdkLightEntries = [
  { source: "tests/plugin-sdk/acp-runtime.ts", test: "tests/plugin-sdk/acp-runtime.test.ts" },
  { source: "tests/plugin-sdk/allow-from.ts", test: "tests/plugin-sdk/allow-from.test.ts" },
  {
    source: "tests/plugin-sdk/keyed-async-queue.ts",
    test: "tests/plugin-sdk/keyed-async-queue.test.ts",
  },
  { source: "tests/plugin-sdk/lazy-value.ts", test: "tests/plugin-sdk/lazy-value.test.ts" },
  {
    source: "tests/plugin-sdk/memory-host-events.ts",
    test: "tests/plugin-sdk/memory-host-events.test.ts",
  },
  {
    source: "tests/plugin-sdk/persistent-dedupe.ts",
    test: "tests/plugin-sdk/memory-host-events.test.ts",
  },
  { source: "tests/plugin-sdk/provider-entry.ts", test: "tests/plugin-sdk/provider-entry.test.ts" },
  {
    source: "tests/plugin-sdk/provider-model-shared.ts",
    test: "tests/plugin-sdk/provider-model-shared.test.ts",
  },
  { source: "tests/plugin-sdk/provider-tools.ts", test: "tests/plugin-sdk/provider-tools.test.ts" },
  {
    source: "tests/plugin-sdk/status-helpers.ts",
    test: "tests/plugin-sdk/status-helpers.test.ts",
  },
  { source: "tests/plugin-sdk/temp-path.ts", test: "tests/plugin-sdk/temp-path.test.ts" },
  {
    source: "tests/plugin-sdk/text-chunking.ts",
    test: "tests/plugin-sdk/text-chunking.test.ts",
  },
  {
    source: "tests/plugin-sdk/webhook-targets.ts",
    test: "tests/plugin-sdk/webhook-targets.test.ts",
  },
];

const pluginSdkLightIncludePatternByFile = new Map(
  pluginSdkLightEntries.flatMap(({ source, test }) => [
    [source, test],
    [test, test],
  ]),
);

export const pluginSdkLightSourceFiles = pluginSdkLightEntries.map(({ source }) => source);
export const pluginSdkLightTestFiles = pluginSdkLightEntries.map(({ test }) => test);

export function isPluginSdkLightTarget(file) {
  return pluginSdkLightIncludePatternByFile.has(normalizeRepoPath(file));
}

export function resolvePluginSdkLightIncludePattern(file) {
  return pluginSdkLightIncludePatternByFile.get(normalizeRepoPath(file)) ?? null;
}
