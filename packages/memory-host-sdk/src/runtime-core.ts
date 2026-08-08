// Focused runtime contract for memory plugin config/state/helpers.

export type { AnyAgentTool } from "./host/operator-runtime-agent.js";
export { resolveCronStyleNow } from "./host/operator-runtime-agent.js";
export { DEFAULT_AGENT_COMPACTION_RESERVE_TOKENS_FLOOR } from "./host/operator-runtime-agent.js";
export { resolveDefaultAgentId, resolveSessionAgentId } from "./host/operator-runtime-agent.js";
export { resolveMemorySearchConfig } from "./host/operator-runtime-agent.js";
export {
  asToolParamsRecord,
  jsonResult,
  readNumberParam,
  readStringParam,
} from "./host/operator-runtime-agent.js";
export { SILENT_REPLY_TOKEN } from "./host/operator-runtime-session.js";
export { parseNonNegativeByteSize } from "./host/operator-runtime-config.js";
export {
  getRuntimeConfig,
  /** @deprecated Use getRuntimeConfig(), or pass the already loaded config through the call path. */
  loadConfig,
} from "./host/operator-runtime-config.js";
export { resolveStateDir } from "./host/operator-runtime-config.js";
export { resolveSessionTranscriptsDirForAgent } from "./host/operator-runtime-config.js";
export { emptyPluginConfigSchema } from "./host/operator-runtime-memory.js";
export {
  buildActiveMemoryPromptSection,
  getMemoryCapabilityRegistration,
  listActiveMemoryPublicArtifacts,
} from "./host/operator-runtime-memory.js";
export { parseAgentSessionKey } from "./host/operator-runtime-agent.js";
export type { OperatorConfig } from "./host/operator-runtime-config.js";
export type { MemoryCitationsMode } from "./host/operator-runtime-config.js";
export type {
  MemoryFlushPlan,
  MemoryFlushPlanResolver,
  MemoryPluginCapability,
  MemoryPluginPublicArtifact,
  MemoryPluginPublicArtifactsProvider,
  MemoryPluginRuntime,
  MemoryPromptSectionBuilder,
} from "./host/operator-runtime-memory.js";
export type { OperatorPluginApi } from "./host/operator-runtime-memory.js";
