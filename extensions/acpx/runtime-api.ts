/**
 * Public runtime API barrel for ACPX. Core and plugin consumers import these
 * SDK-facing ACP runtime contracts instead of reaching into ACPX internals.
 */
export type { AcpRuntimeErrorCode } from "@gabrielvfonseca/operator/plugin-sdk/acp-runtime-backend";
export {
  AcpRuntimeError,
  getAcpRuntimeBackend,
  tryDispatchAcpReplyHook,
  registerAcpRuntimeBackend,
  unregisterAcpRuntimeBackend,
} from "@gabrielvfonseca/operator/plugin-sdk/acp-runtime-backend";
export type {
  AcpRuntime,
  AcpRuntimeCapabilities,
  AcpRuntimeDoctorReport,
  AcpRuntimeEnsureInput,
  AcpRuntimeEvent,
  AcpRuntimeHandle,
  AcpRuntimeStatus,
  AcpRuntimeTurn,
  AcpRuntimeTurnAttachment,
  AcpRuntimeTurnInput,
  AcpRuntimeTurnResult,
  AcpRuntimeTurnResultError,
  AcpSessionUpdateTag,
} from "@gabrielvfonseca/operator/plugin-sdk/acp-runtime-backend";
export type {
  OperatorPluginApi,
  OperatorPluginConfigSchema,
  OperatorPluginService,
  OperatorPluginServiceContext,
  PluginLogger,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export type {
  PluginHookReplyDispatchContext,
  PluginHookReplyDispatchEvent,
  PluginHookReplyDispatchResult,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export type {
  WindowsSpawnProgram,
  WindowsSpawnProgramCandidate,
  WindowsSpawnResolution,
} from "@gabrielvfonseca/operator/plugin-sdk/windows-spawn";
export {
  applyWindowsSpawnProgramPolicy,
  materializeWindowsSpawnProgram,
  resolveWindowsSpawnProgramCandidate,
} from "@gabrielvfonseca/operator/plugin-sdk/windows-spawn";
export {
  listKnownProviderAuthEnvVarNames,
  omitEnvKeysCaseInsensitive,
} from "@gabrielvfonseca/operator/plugin-sdk/provider-env-vars";
