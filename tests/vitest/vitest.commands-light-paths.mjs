// Test routing map for lightweight command tests and their source triggers.
const normalizeRepoPath = (value) => value.replaceAll("\\", "/");

const commandsLightEntries = [
  { source: "tests/commands/cleanup-utils.ts", test: "tests/commands/cleanup-utils.test.ts" },
  { test: "tests/commands/auth-choice.test.ts" },
  {
    source: "tests/commands/dashboard.links.ts",
    test: "tests/commands/dashboard.links.test.ts",
  },
  {
    source: "tests/commands/dashboard.ts",
    test: "tests/commands/dashboard.test.ts",
  },
  { test: "tests/commands/daemon-install-helpers.test.ts" },
  { source: "tests/commands/doctor-browser.ts", test: "tests/commands/doctor-browser.test.ts" },
  {
    source: "tests/commands/doctor-gateway-auth-token.ts",
    test: "tests/commands/doctor-gateway-auth-token.test.ts",
  },
  {
    source: "tests/commands/doctor/shared/channel-plugin-blockers.ts",
    test: "tests/commands/doctor/shared/channel-plugin-blockers.test.ts",
  },
  {
    source: "tests/commands/doctor/shared/missing-configured-plugin-install.ts",
    test: "tests/commands/doctor/shared/missing-configured-plugin-install.test.ts",
  },
  {
    source: "tests/commands/doctor/shared/preview-warnings.ts",
    test: "tests/commands/doctor/shared/preview-warnings.test.ts",
  },
  {
    source: "tests/commands/doctor/shared/release-configured-plugin-installs.ts",
    test: "tests/commands/doctor/shared/release-configured-plugin-installs.test.ts",
  },
  {
    source: "tests/commands/doctor/shared/stale-plugin-config.ts",
    test: "tests/commands/doctor/shared/stale-plugin-config.test.ts",
  },
  {
    source: "tests/commands/doctor/shared/stale-oauth-profile-shadows.ts",
    test: "tests/commands/doctor/shared/stale-oauth-profile-shadows.test.ts",
  },
  {
    source: "tests/commands/gateway-status/helpers.ts",
    test: "tests/commands/gateway-status/helpers.test.ts",
  },
  { test: "tests/commands/models/auth.test.ts" },
  { test: "tests/commands/models/list.auth-index.test.ts" },
  { test: "tests/commands/models/list.list-command.forward-compat.test.ts" },
  {
    source: "tests/commands/models/list.status-command.ts",
    test: "tests/commands/models/list.status.test.ts",
  },
  {
    source: "tests/commands/sandbox-formatters.ts",
    test: "tests/commands/sandbox-formatters.test.ts",
  },
  {
    source: "tests/commands/status-json-command.ts",
    test: "tests/commands/status-json-command.test.ts",
  },
  {
    source: "tests/commands/status-json-payload.ts",
    test: "tests/commands/status-json-payload.test.ts",
  },
  {
    source: "tests/commands/status-json-runtime.ts",
    test: "tests/commands/status-json-runtime.test.ts",
  },
  {
    source: "tests/commands/status-overview-rows.ts",
    test: "tests/commands/status-overview-rows.test.ts",
  },
  {
    source: "tests/commands/status-overview-surface.ts",
    test: "tests/commands/status-overview-surface.test.ts",
  },
  {
    source: "tests/commands/status-overview-values.ts",
    test: "tests/commands/status-overview-values.test.ts",
  },
  { source: "tests/commands/text-format.ts", test: "tests/commands/text-format.test.ts" },
];

const commandsLightIncludePatternByFile = new Map(
  commandsLightEntries.flatMap(({ source, test }) =>
    source
      ? [
          [source, test],
          [test, test],
        ]
      : [[test, test]],
  ),
);

export const commandsLightSourceFiles = commandsLightEntries.flatMap(({ source }) =>
  source ? [source] : [],
);
export const commandsLightTestFiles = commandsLightEntries.map(({ test }) => test);

export function isCommandsLightTarget(file) {
  return commandsLightIncludePatternByFile.has(normalizeRepoPath(file));
}

export function resolveCommandsLightIncludePattern(file) {
  return commandsLightIncludePatternByFile.get(normalizeRepoPath(file)) ?? null;
}
