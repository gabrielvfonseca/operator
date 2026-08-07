// Unit-fast test discovery and classification helpers for fast local routing.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  commandsLightSourceFiles,
  commandsLightTestFiles,
} from "./vitest.commands-light-paths.mjs";
import { pluginSdkLightSourceFiles, pluginSdkLightTestFiles } from "./vitest.plugin-sdk-paths.mjs";
import { boundaryTestFiles, bundledPluginDependentUnitTestFiles } from "./vitest.unit-paths.mjs";

const normalizeRepoPath = (value) => value.replaceAll("\\", "/");

const unitFastCandidateGlobs = [
  "packages/memory-host-sdk/**/*.test.ts",
  "packages/plugin-package-contract/**/*.test.ts",
  "tests/acp/**/*.test.ts",
  "tests/agents/**/*.test.ts",
  "tests/skills/**/*.test.ts",
  "tests/auto-reply/**/*.test.ts",
  "tests/bootstrap/**/*.test.ts",
  "tests/channels/**/*.test.ts",
  "tests/cli/**/*.test.ts",
  "tests/commands/**/*.test.ts",
  "tests/compat/**/*.test.ts",
  "tests/config/**/*.test.ts",
  "tests/daemon/**/*.test.ts",
  "tests/i18n/**/*.test.ts",
  "tests/hooks/**/*.test.ts",
  "tests/image-generation/**/*.test.ts",
  "tests/infra/**/*.test.ts",
  "tests/interactive/**/*.test.ts",
  "tests/link-understanding/**/*.test.ts",
  "tests/logging/**/*.test.ts",
  "packages/markdown-core/tests/src/**/*.test.ts",
  "packages/media-core/tests/src/**/*.test.ts",
  "packages/terminal-core/tests/src/**/*.test.ts",
  "tests/media/**/*.test.ts",
  "tests/media-generation/**/*.test.ts",
  "tests/media-understanding/**/*.test.ts",
  "tests/memory-host-sdk/**/*.test.ts",
  "tests/model-catalog/**/*.test.ts",
  "tests/music-generation/**/*.test.ts",
  "tests/node-host/**/*.test.ts",
  "tests/plugin-sdk/**/*.test.ts",
  "tests/plugins/**/*.test.ts",
  "tests/poll-params.test.ts",
  "tests/polls.test.ts",
  "tests/process/**/*.test.ts",
  "tests/proxy-capture/**/*.test.ts",
  "tests/routing/**/*.test.ts",
  "tests/sessions/**/*.test.ts",
  "tests/shared/**/*.test.ts",
  "tests/test-utils/**/*.test.ts",
  "tests/tasks/**/*.test.ts",
  "tests/tts/**/*.test.ts",
  "tests/utils/**/*.test.ts",
  "tests/video-generation/**/*.test.ts",
  "tests/web/**/*.test.ts",
  "tests/wizard/**/*.test.ts",
  "test/**/*.test.ts",
];
export const forcedUnitFastTestFiles = [
  "packages/memory-host-sdk/tests/src/host/batch-http.test.ts",
  "packages/memory-host-sdk/tests/src/host/backend-config.test.ts",
  "packages/memory-host-sdk/tests/src/host/embeddings-remote-fetch.test.ts",
  "packages/memory-host-sdk/tests/src/host/internal.test.ts",
  "packages/memory-host-sdk/tests/src/host/post-json.test.ts",
  "packages/memory-host-sdk/tests/src/host/qmd-process.test.ts",
  "packages/memory-host-sdk/tests/src/host/session-files.test.ts",
  "tests/acp/client.test.ts",
  "tests/acp/control-plane/manager.backend-failover.test.ts",
  "tests/acp/control-plane/manager.failover.test.ts",
  "tests/acp/control-plane/manager.runtime-config.test.ts",
  "tests/acp/control-plane/manager.runtime-handles.test.ts",
  "tests/acp/control-plane/manager.test.ts",
  "tests/acp/control-plane/manager.turn-results.test.ts",
  "tests/acp/session-mapper.test.ts",
  "tests/acp/persistent-bindings.lifecycle.test.ts",
  "tests/acp/translator.prompt-prefix.test.ts",
  "tests/acp/translator.cancel-scoping.test.ts",
  "tests/acp/translator.stop-reason.test.ts",
  "tests/acp/persistent-bindings.test.ts",
  "tests/acp/server.startup.test.ts",
  "tests/acp/translator.final-snapshots.test.ts",
  "tests/acp/translator.prompt-size.test.ts",
  "tests/acp/translator.replay.test.ts",
  "tests/acp/translator.session-config.test.ts",
  "tests/acp/translator.session-list.test.ts",
  "tests/acp/translator.session-rate-limit.test.ts",
  "tests/acp/translator.session-setup.test.ts",
  "tests/acp/translator.session-snapshot.test.ts",
  "tests/acp/translator.set-session-mode.test.ts",
  "tests/acp/translator.tool-streaming.test.ts",
  "tests/browser-lifecycle-cleanup.test.ts",
  "extensions/canvas/tests/src/host/server.test.ts",
  "tests/system-agent/audit.test.ts",
  "tests/system-agent/assistant.configured.test.ts",
  "tests/system-agent/system-agent.test.ts",
  "tests/system-agent/operations.test.ts",
  "tests/system-agent/overview.test.ts",
  "tests/system-agent/rescue-policy.test.ts",
  "tests/system-agent/rescue-message.test.ts",
  "tests/system-agent/tui-backend.test.ts",
  "tests/flows/channel-setup.status.test.ts",
  "tests/flows/provider-flow.test.ts",
  "tests/context-engine/context-engine.test.ts",
  "extensions/canvas/tests/src/host/server.state-dir.test.ts",
  "tests/docs/clawhub-plugin-docs.test.ts",
  "tests/docs/channel-config-examples.test.ts",
  "tests/docs/plugin-doc-examples.test.ts",
  "tests/docs/install-cloud-secrets.test.ts",
  "tests/docker-build-cache.test.ts",
  "tests/docker-image-digests.test.ts",
  "tests/dockerfile.test.ts",
  "tests/entry.compile-cache.test.ts",
  "tests/entry.respawn.test.ts",
  "tests/entry.version-fast-path.test.ts",
  "tests/entry.test.ts",
  "tests/flows/doctor-startup-channel-maintenance.test.ts",
  "tests/flows/search-setup.test.ts",
  "tests/i18n/registry.test.ts",
  "tests/image-generation/openai-compatible-image-provider.test.ts",
  "tests/image-generation/provider-registry.test.ts",
  "tests/install-sh-version.test.ts",
  "tests/logger.test.ts",
  "tests/library.test.ts",
  "tests/media-generation/provider-capabilities.contract.test.ts",
  "tests/music-generation/runtime.test.ts",
  "tests/mcp/channel-server.shutdown-unhandled-rejection.test.ts",
  "tests/mcp/operator-tools-serve.test.ts",
  "tests/node-host/plugin-node-host.test.ts",
  "tests/node-host/invoke-system-run-plan.test.ts",
  "tests/node-host/invoke-system-run.test.ts",
  "tests/pairing/pairing-challenge.test.ts",
  "tests/pairing/setup-code.test.ts",
  "tests/plugin-activation-boundary.test.ts",
  "tests/plugin-sdk/memory-host-events.test.ts",
  "tests/proxy-capture/env.test.ts",
  "tests/proxy-capture/runtime.test.ts",
  "tests/proxy-capture/proxy-server.test.ts",
  "tests/proxy-capture/store.sqlite.test.ts",
  "tests/talk/agent-consult-runtime.test.ts",
  "tests/talk/session-runtime.test.ts",
  "tests/security/audit-channel-account-metadata.test.ts",
  "tests/security/audit-channel-source-config-discord.test.ts",
  "tests/security/audit-config-basics.test.ts",
  "tests/security/audit-channel-dm-policy.test.ts",
  "tests/security/audit-channel-source-config-slack.test.ts",
  "tests/security/audit-channel-readonly-resolution.test.ts",
  "tests/security/audit-config-symlink.test.ts",
  "tests/security/audit-exec-surface.test.ts",
  "tests/security/audit-exec-sandbox-host.test.ts",
  "tests/security/audit-exec-safe-bins.test.ts",
  "tests/security/dangerous-config-flags.test.ts",
  "tests/security/audit-extra.sync.test.ts",
  "tests/security/audit-filesystem-windows.test.ts",
  "tests/security/audit-gateway-exposure.test.ts",
  "tests/security/audit-gateway.test.ts",
  "tests/security/audit-gateway-auth-selection.test.ts",
  "tests/security/audit-gateway-http-auth.test.ts",
  "tests/security/audit-gateway-tools-http.test.ts",
  "tests/security/audit-hooks-routing.test.ts",
  "tests/security/audit-sandbox-docker-config.test.ts",
  "tests/security/audit-sandbox-browser.test.ts",
  "tests/security/safe-regex.test.ts",
  "tests/security/audit-model-hygiene.test.ts",
  "tests/security/audit-small-model-risk.test.ts",
  "tests/security/audit-node-command-findings.test.ts",
  "tests/security/audit-extra.async.test.ts",
  "tests/security/audit-probe-failure.test.ts",
  "tests/security/audit-plugin-code-safety.test.ts",
  "tests/security/audit-summary.test.ts",
  "tests/security/audit-synced-folder.test.ts",
  "tests/security/audit-trust-model.test.ts",
  "tests/channels/message-access/message-access.test.ts",
  "tests/security/audit-plugins-trust.test.ts",
  "tests/security/audit-plugin-readonly-scope.test.ts",
  "tests/security/audit-loopback-logging.test.ts",
  "tests/skills/security/workspace-audit.test.ts",
  "tests/security/external-content.test.ts",
  "tests/security/fix.test.ts",
  "tests/security/scan-paths.test.ts",
  "tests/skills/security/scanner.test.ts",
  "tests/security/audit-config-include-perms.test.ts",
  "tests/security/context-visibility.test.ts",
  "tests/realtime-transcription/websocket-session.test.ts",
  "tests/talk/agent-consult-tool.test.ts",
  "tests/routing/resolve-route.test.ts",
  "tests/sessions/transcript-events.test.ts",
  "tests/status/status-message.test.ts",
  "tests/security/windows-acl.test.ts",
  "tests/trajectory/cleanup.test.ts",
  "tests/trajectory/export.test.ts",
  "tests/trajectory/metadata.test.ts",
  "tests/trajectory/runtime.test.ts",
  "tests/tts/openai-compatible-speech-provider.test.ts",
  "tests/tts/tts.test.ts",
  "tests/tts/provider-registry.test.ts",
  "tests/tts/status-config.test.ts",
  "tests/tts/tts-config.test.ts",
  "packages/terminal-core/tests/src/restore.test.ts",
  "packages/terminal-core/tests/src/table.test.ts",
  "tests/test-helpers/state-dir-env.test.ts",
  "tests/test-utils/env.test.ts",
  "tests/test-utils/operator-test-state.test.ts",
  "tests/test-utils/temp-home.test.ts",
  "tests/utils.test.ts",
  "tests/version.test.ts",
  "tests/video-generation/provider-registry.test.ts",
];
const forcedUnitFastTestFileSet = new Set(forcedUnitFastTestFiles);
const unitFastCandidateExactFiles = [...pluginSdkLightTestFiles, ...commandsLightTestFiles];
const unitFastCandidateExactFileSet = new Set(unitFastCandidateExactFiles);
const unitFastSourceExactFileSet = new Set([
  ...pluginSdkLightSourceFiles,
  ...commandsLightSourceFiles,
]);
const broadUnitFastCandidateGlobs = [
  "tests/**/*.test.ts",
  "packages/**/*.test.ts",
  "test/**/*.test.ts",
];
const ownerRoutedUnitTestFiles = [
  "tests/agents/openai-transport-stream.test.ts",
  "tests/auto-reply/reply/dispatch-from-config.test.ts",
];
const broadUnitFastCandidateSkipGlobs = [
  "**/*.e2e.test.ts",
  "**/*.live.test.ts",
  "test/fixtures/**/*.test.ts",
  "test/setup-home-isolation.test.ts",
  // Explicit bundled ownership outranks content-based discovery. Otherwise extracting
  // a test body can silently move its entry to a config with the wrong mocked setup.
  ...bundledPluginDependentUnitTestFiles,
  // These entries register tests from imported utility modules. Their tiny entry files
  // cannot carry the stateful-content signals that keep them in their owner configs.
  ...ownerRoutedUnitTestFiles,
  "tests/agents/sandbox.resolveSandboxContext.test.ts",
  "tests/acp/runtime/session-meta.test.ts",
  "tests/channels/plugins/contracts/**/*.test.ts",
  "tests/config/**/*.test.ts",
  "tests/gateway/**/*.test.ts",
  "tests/media-generation/**/*.contract.test.ts",
  "tests/media-generation/runtime-shared.test.ts",
  "tests/music-generation/runtime.test.ts",
  "tests/proxy-capture/runtime.test.ts",
  "tests/plugins/install.npm-spec.test.ts",
  "tests/plugins/contracts/**/*.test.ts",
  "tests/pairing/pairing-store.test.ts",
  "tests/plugin-sdk/browser-subpaths.test.ts",
  "tests/security/**/*.test.ts",
  "tests/secrets/**/*.test.ts",
  "test/helpers/stt-live-audio.test.ts",
  "test/vitest-extensions-config.test.ts",
  "test/vitest-unit-paths.test.ts",
  ...boundaryTestFiles,
];

const disqualifyingPatterns = [
  {
    code: "jsdom-environment",
    pattern: /@vitest-environment\s+jsdom/u,
  },
  {
    code: "module-mocking",
    pattern: /\bvi\.(?:mock|doMock|unmock|doUnmock|importActual|resetModules)\s*\(/u,
  },
  {
    code: "module-mocking-helper",
    pattern: /(?:plugins-cli-test-helpers|manager\.test-helpers)/u,
  },
  {
    code: "vitest-mock-api",
    pattern: /\bvi\b/u,
  },
  {
    code: "dynamic-import",
    pattern: /\b(?:await\s+)?import\s*\(/u,
  },
  {
    code: "fake-timers",
    pattern:
      /\bvi\.(?:useFakeTimers|setSystemTime|advanceTimers|runAllTimers|runOnlyPendingTimers)\s*\(/u,
  },
  {
    code: "env-or-global-stub",
    pattern: /\bvi\.(?:stubEnv|stubGlobal|unstubAllEnvs|unstubAllGlobals)\s*\(/u,
  },
  {
    code: "process-env-mutation",
    pattern: /(?:process\.env(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])?\s*=|delete\s+process\.env)/u,
  },
  {
    code: "global-mutation",
    pattern: /(?:globalThis|global)\s*\[[^\]]+\]\s*=/u,
  },
  {
    code: "filesystem-state",
    pattern:
      /\b(?:mkdtemp|rmSync|writeFileSync|appendFileSync|mkdirSync|createTemp|makeTempDir|tempDir|tmpdir|node:fs|node:os)\b/u,
  },
  {
    code: "runtime-singleton-state",
    pattern: /\b(?:setActivePluginRegistry|resetPluginRuntimeStateForTest|reset.*ForTest)\s*\(/u,
  },
];

const statefulTestHelperImportPattern =
  /\bfrom\s+["']([^"']*(?:test-support|\.harness)(?:\.js|\.ts)?)["']/gu;
const statefulTestHelperByKey = new Map();

function importsStatefulTestHelper(cwd, file, source) {
  for (const match of source.matchAll(statefulTestHelperImportPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) {
      continue;
    }
    const helperPath = path.join(
      path.dirname(file),
      specifier.endsWith(".js")
        ? `${specifier.slice(0, -3)}.ts`
        : specifier.endsWith(".ts")
          ? specifier
          : `${specifier}.ts`,
    );
    const cacheKey = `${normalizeRepoPath(cwd)}\0${normalizeRepoPath(helperPath)}`;
    let stateful = statefulTestHelperByKey.get(cacheKey);
    if (stateful === undefined) {
      try {
        const helperSource = fs.readFileSync(path.join(cwd, helperPath), "utf8");
        stateful = classifyUnitFastTestFileContent(helperSource).length > 0;
      } catch {
        stateful = false;
      }
      statefulTestHelperByKey.set(cacheKey, stateful);
    }
    if (stateful) {
      return true;
    }
  }
  return false;
}

function matchesAnyGlob(file, patterns) {
  return patterns.some((pattern) => path.matchesGlob(file, pattern));
}

const unitFastCandidateFileByPath = new Map();

function isUnitFastCandidateFile(file) {
  const cached = unitFastCandidateFileByPath.get(file);
  if (cached !== undefined) {
    return cached;
  }
  const candidate =
    forcedUnitFastTestFileSet.has(file) ||
    unitFastCandidateExactFileSet.has(file) ||
    (matchesAnyGlob(file, unitFastCandidateGlobs) &&
      !matchesAnyGlob(file, broadUnitFastCandidateSkipGlobs));
  // Candidate rules are static for the process lifetime; scoped configs overlap heavily.
  unitFastCandidateFileByPath.set(file, candidate);
  return candidate;
}

function walkFiles(directory, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "vendor") {
        continue;
      }
      walkFiles(entryPath, files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      files.push(normalizeRepoPath(entryPath));
    }
  }
  return files;
}

const walkedTestFilesByCwd = new Map();

function collectRepoTestFilesFromGit(cwd) {
  const result = spawnSync("git", ["ls-files", "--", "src", "packages", "test"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (result.status !== 0) {
    return null;
  }
  return result.stdout
    .split("\n")
    .map((file) => normalizeRepoPath(file.trim()))
    .filter((file) => file.endsWith(".test.ts"));
}

function collectRepoTestFiles(cwd) {
  const normalizedCwd = normalizeRepoPath(cwd);
  const cached = walkedTestFilesByCwd.get(normalizedCwd);
  if (cached) {
    return cached;
  }
  const files =
    collectRepoTestFilesFromGit(cwd) ??
    ["src", "packages", "test"]
      .flatMap((directory) => walkFiles(path.join(cwd, directory)))
      .map((file) => normalizeRepoPath(path.relative(cwd, file)));
  walkedTestFilesByCwd.set(normalizedCwd, files);
  return files;
}

const unitFastCandidateInventoryByCwd = new Map();

function collectUnitFastCandidateInventory(cwd) {
  const cacheKey = normalizeRepoPath(cwd);
  const cached = unitFastCandidateInventoryByCwd.get(cacheKey);
  if (cached) {
    return cached;
  }
  const inventory = [
    ...new Set([
      ...collectRepoTestFiles(cwd),
      ...unitFastCandidateExactFiles,
      ...forcedUnitFastTestFiles,
    ]),
  ];
  // Git inventory and routing constants are stable for the lifetime of a config process.
  unitFastCandidateInventoryByCwd.set(cacheKey, inventory);
  return inventory;
}

function normalizeScopedDir(dir) {
  const normalized = normalizeRepoPath(dir ?? "").replace(/^\.\/+|\/+$/gu, "");
  return normalized === "." ? "" : normalized;
}

function hasRepoRootPrefix(value) {
  return /^(?:apps|extensions|packages|src|test|ui)(?:\/|$)/u.test(value);
}

function cannotSafelyNarrowIncludePattern(value, dir) {
  return (
    value.startsWith("!") ||
    value.startsWith("./") ||
    /^(?:[A-Za-z]:\/|\/)/u.test(value) ||
    /(?:^|\/)\.\.(?:\/|$)/u.test(value) ||
    (Boolean(dir) && /^[{[(]/u.test(value))
  );
}

function anchorScopedIncludePattern(value, dir) {
  const normalized = normalizeRepoPath(value);
  if (!dir || hasRepoRootPrefix(normalized)) {
    return normalized;
  }
  return `${dir}/${normalized}`;
}

function isFileWithinScope(file, dir) {
  return !dir || file.startsWith(`${dir}/`);
}

function literalGlobPrefix(pattern) {
  const dynamicIndex = pattern.search(/[!?*[{(@+]/u);
  return dynamicIndex < 0 ? pattern : pattern.slice(0, dynamicIndex);
}

function matchesCompiledInclude(file, compiledPatterns) {
  return compiledPatterns.some(
    ({ pattern, prefix }) => file.startsWith(prefix) && path.matchesGlob(file, pattern),
  );
}

export function classifyUnitFastTestFileContent(source) {
  const reasons = [];
  for (const { code, pattern } of disqualifyingPatterns) {
    if (pattern.test(source)) {
      reasons.push(code);
    }
  }
  return reasons;
}

const unitFastCandidatesByKey = new Map();

function collectUnitFastCandidates(cwd, scope) {
  const cacheKey = `${normalizeRepoPath(cwd)}\0${scope}`;
  const cached = unitFastCandidatesByKey.get(cacheKey);
  if (cached) {
    return cached;
  }
  const broad = scope === "broad";
  const candidates = collectUnitFastCandidateInventory(cwd)
    .filter((file) => {
      if (!broad) {
        return isUnitFastCandidateFile(file);
      }
      return (
        forcedUnitFastTestFileSet.has(file) ||
        unitFastCandidateExactFileSet.has(file) ||
        (matchesAnyGlob(file, broadUnitFastCandidateGlobs) &&
          !matchesAnyGlob(file, broadUnitFastCandidateSkipGlobs))
      );
    })
    .toSorted((a, b) => a.localeCompare(b));
  // Candidate discovery is immutable for the lifetime of a Vitest/audit process.
  unitFastCandidatesByKey.set(cacheKey, candidates);
  return candidates;
}

export function collectUnitFastTestCandidates(cwd = process.cwd()) {
  return collectUnitFastCandidates(cwd, "default");
}

export function collectBroadUnitFastTestCandidates(cwd = process.cwd()) {
  return collectUnitFastCandidates(cwd, "broad");
}

const unitFastAnalysisByKey = new Map();
const unitFastFileAnalysisByKey = new Map();

function analyzeUnitFastTestFile(cwd, file) {
  const cacheKey = `${normalizeRepoPath(cwd)}\0${file}`;
  const cached = unitFastFileAnalysisByKey.get(cacheKey);
  if (cached) {
    return cached;
  }

  let analysis;
  try {
    const source = fs.readFileSync(path.join(cwd, file), "utf8");
    const reasons = classifyUnitFastTestFileContent(source);
    if (importsStatefulTestHelper(cwd, file, source)) {
      // The helper executes in the importing file's module scope, so its mocks and
      // singleton mutations need the same isolation as stateful code in the test itself.
      reasons.push("stateful-test-helper");
    }
    const forced = forcedUnitFastTestFileSet.has(file);
    analysis = {
      file,
      unitFast: forced || reasons.every((reason) => reason === "stateful-test-helper"),
      forced,
      reasons,
    };
  } catch {
    analysis = {
      file,
      unitFast: false,
      reasons: ["missing-file"],
    };
  }

  // Discovery is a process-start snapshot; default and broad audits overlap heavily.
  unitFastFileAnalysisByKey.set(cacheKey, analysis);
  return analysis;
}

export function collectUnitFastTestFileAnalysis(cwd = process.cwd(), options = {}) {
  const cacheKey = `${normalizeRepoPath(cwd)}\0${options.scope ?? "default"}`;
  const cached = unitFastAnalysisByKey.get(cacheKey);
  if (cached) {
    return cached;
  }
  const candidates =
    options.scope === "broad"
      ? collectBroadUnitFastTestCandidates(cwd)
      : collectUnitFastTestCandidates(cwd);
  const analysis = candidates.map((file) => analyzeUnitFastTestFile(cwd, file));
  unitFastAnalysisByKey.set(cacheKey, analysis);
  return analysis;
}

let cachedUnitFastTestFiles = null;
let cachedUnitFastTestFileSet = null;
let cachedUnitFastIsolatedTestFiles = null;
let cachedUnitFastIsolatedTestFileSet = null;
let cachedUnitFastTimerTestFiles = null;
let cachedUnitFastTimerTestFileSet = null;
const scopedUnitFastTestFilesByKey = new Map();

export function getUnitFastTestFilesForIncludePatterns(includePatterns, options = {}) {
  const cwd = process.cwd();
  const normalizedCwd = normalizeRepoPath(cwd);
  const dir = normalizeScopedDir(options.dir);
  const normalizedPatterns = includePatterns.map(normalizeRepoPath);
  if (normalizedPatterns.some((pattern) => cannotSafelyNarrowIncludePattern(pattern, dir))) {
    // Keep the former full exclusion list when Vitest syntax cannot be safely mapped to repo paths.
    return getUnitFastTestFiles();
  }
  const patterns = [
    ...new Set(normalizedPatterns.map((pattern) => anchorScopedIncludePattern(pattern, dir))),
  ].toSorted((left, right) => left.localeCompare(right));
  const cacheKey = JSON.stringify([normalizedCwd, dir, patterns]);
  const cached = scopedUnitFastTestFilesByKey.get(cacheKey);
  if (cached) {
    return cached;
  }
  if (patterns.length === 0) {
    scopedUnitFastTestFilesByKey.set(cacheKey, []);
    return [];
  }
  const compiledPatterns = patterns.map((pattern) => ({
    pattern,
    prefix: literalGlobPrefix(pattern),
  }));

  const files = collectUnitFastCandidateInventory(cwd)
    .filter((file) => {
      return (
        isFileWithinScope(file, dir) &&
        matchesCompiledInclude(file, compiledPatterns) &&
        isUnitFastCandidateFile(file)
      );
    })
    .toSorted((a, b) => a.localeCompare(b))
    .filter((file) => analyzeUnitFastTestFile(cwd, file).unitFast);

  // Scoped discovery is a process-start snapshot, matching the full unit-fast inventory cache.
  scopedUnitFastTestFilesByKey.set(cacheKey, files);
  return files;
}

export function getUnitFastTestFiles() {
  if (cachedUnitFastTestFiles !== null) {
    return cachedUnitFastTestFiles;
  }
  cachedUnitFastTestFiles = collectUnitFastTestFileAnalysis()
    .filter((entry) => entry.unitFast)
    .map((entry) => entry.file);
  return cachedUnitFastTestFiles;
}

export function getUnitFastTimerTestFiles() {
  if (cachedUnitFastTimerTestFiles !== null) {
    return cachedUnitFastTimerTestFiles;
  }
  cachedUnitFastTimerTestFiles = collectUnitFastTestFileAnalysis()
    .filter((entry) => entry.unitFast && entry.reasons.includes("fake-timers"))
    .map((entry) => entry.file);
  return cachedUnitFastTimerTestFiles;
}

export function getUnitFastIsolatedTestFiles() {
  if (cachedUnitFastIsolatedTestFiles !== null) {
    return cachedUnitFastIsolatedTestFiles;
  }
  const timerTestFiles = new Set(getUnitFastTimerTestFiles());
  cachedUnitFastIsolatedTestFiles = collectUnitFastTestFileAnalysis()
    .filter(
      (entry) =>
        entry.unitFast &&
        !timerTestFiles.has(entry.file) &&
        (entry.forced || entry.reasons.includes("stateful-test-helper")),
    )
    .map((entry) => entry.file);
  return cachedUnitFastIsolatedTestFiles;
}

function getUnitFastTestFileSet() {
  if (cachedUnitFastTestFileSet !== null) {
    return cachedUnitFastTestFileSet;
  }
  cachedUnitFastTestFileSet = new Set(getUnitFastTestFiles());
  return cachedUnitFastTestFileSet;
}

function getUnitFastTimerTestFileSet() {
  if (cachedUnitFastTimerTestFileSet !== null) {
    return cachedUnitFastTimerTestFileSet;
  }
  cachedUnitFastTimerTestFileSet = new Set(getUnitFastTimerTestFiles());
  return cachedUnitFastTimerTestFileSet;
}

function getUnitFastIsolatedTestFileSet() {
  if (cachedUnitFastIsolatedTestFileSet !== null) {
    return cachedUnitFastIsolatedTestFileSet;
  }
  cachedUnitFastIsolatedTestFileSet = new Set(getUnitFastIsolatedTestFiles());
  return cachedUnitFastIsolatedTestFileSet;
}

function isUnitFastTestFileOnDemand(file, cwd = process.cwd()) {
  const normalized = normalizeRepoPath(file);
  if (!isUnitFastCandidateFile(normalized)) {
    return false;
  }
  return analyzeUnitFastTestFile(cwd, normalized).unitFast;
}

export function isUnitFastTestFile(file) {
  return getUnitFastTestFileSet().has(normalizeRepoPath(file));
}

export function isUnitFastTimerTestFile(file) {
  return getUnitFastTimerTestFileSet().has(normalizeRepoPath(file));
}

export function isUnitFastIsolatedTestFile(file) {
  return getUnitFastIsolatedTestFileSet().has(normalizeRepoPath(file));
}

export function resolveUnitFastTestIncludePattern(file) {
  const normalized = normalizeRepoPath(file);
  if (isUnitFastTimerTestFile(normalized)) {
    return null;
  }
  if (isUnitFastIsolatedTestFile(normalized)) {
    return null;
  }
  if (isUnitFastTestFileOnDemand(normalized)) {
    return normalized;
  }
  const siblingTestFile = normalized.replace(/\.ts$/u, ".test.ts");
  if (isUnitFastTimerTestFile(siblingTestFile)) {
    return null;
  }
  if (isUnitFastIsolatedTestFile(siblingTestFile)) {
    return null;
  }
  if (isUnitFastTestFileOnDemand(siblingTestFile)) {
    return siblingTestFile;
  }
  if (unitFastSourceExactFileSet.has(normalized)) {
    const exactTestFile = normalized.replace(/\.ts$/u, ".test.ts");
    return isUnitFastTestFileOnDemand(exactTestFile) ? exactTestFile : null;
  }
  return null;
}

export function resolveUnitFastTimerTestIncludePattern(file) {
  const normalized = normalizeRepoPath(file);
  if (isUnitFastTimerTestFile(normalized)) {
    return normalized;
  }
  const siblingTestFile = normalized.replace(/\.ts$/u, ".test.ts");
  return isUnitFastTimerTestFile(siblingTestFile) ? siblingTestFile : null;
}

export function resolveUnitFastIsolatedTestIncludePattern(file) {
  const normalized = normalizeRepoPath(file);
  if (isUnitFastIsolatedTestFile(normalized)) {
    return normalized;
  }
  const siblingTestFile = normalized.replace(/\.ts$/u, ".test.ts");
  return isUnitFastIsolatedTestFile(siblingTestFile) ? siblingTestFile : null;
}
