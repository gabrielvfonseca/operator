// Real workspace contract for memory engine foundation concerns.

export {
  resolveAgentContextLimits,
  resolveAgentDir,
  resolveAgentWorkspaceDir,
  resolveDefaultAgentId,
  resolveSessionAgentId,
} from "./host/operator-runtime-agent.js";
export {
  resolveMemorySearchConfig,
  type ResolvedMemorySearchConfig,
} from "./host/operator-runtime-agent.js";
export { parseDurationMs } from "./host/operator-runtime-config.js";
export { loadConfig } from "./host/operator-runtime-config.js";
export { resolveStateDir } from "./host/operator-runtime-config.js";
export { resolveSessionTranscriptsDirForAgent } from "./host/operator-runtime-config.js";
export {
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
} from "./host/operator-runtime-config.js";
export { root } from "./host/operator-runtime-io.js";
export { isPathInside } from "./host/fs-utils.js";
export { createSubsystemLogger } from "./host/operator-runtime-io.js";
export { detectMime } from "./host/operator-runtime-io.js";
export { resolveGlobalSingleton } from "./host/operator-runtime-io.js";
export { onSessionTranscriptUpdate } from "./host/operator-runtime-session.js";
export { splitShellArgs } from "./host/operator-runtime-io.js";
export { runTasksWithConcurrency } from "./host/operator-runtime-io.js";
export {
  shortenHomeInString,
  shortenHomePath,
  resolveUserPath,
  truncateUtf16Safe,
} from "./host/operator-runtime-io.js";
export type { OperatorConfig } from "./host/operator-runtime-config.js";
export type { SessionSendPolicyConfig } from "./host/operator-runtime-config.js";
export type { SecretInput } from "./host/operator-runtime-config.js";
export type {
  MemoryBackend,
  MemoryCitationsMode,
  MemoryQmdConfig,
  MemoryQmdIndexPath,
  MemoryQmdMcporterConfig,
  MemoryQmdSearchMode,
} from "./host/operator-runtime-config.js";
export type { MemorySearchConfig } from "./host/operator-runtime-config.js";
