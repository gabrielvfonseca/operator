// Diagnostics Otel API module exposes the plugin public contract.
export {
  createChildDiagnosticTraceContext,
  createDiagnosticTraceContext,
  emitDiagnosticEvent,
  formatDiagnosticTraceparent,
  isValidDiagnosticSpanId,
  isValidDiagnosticTraceFlags,
  isValidDiagnosticTraceId,
  onDiagnosticEvent,
  parseDiagnosticTraceparent,
  type DiagnosticEventMetadata,
  type DiagnosticEventPayload,
  type DiagnosticEventPrivateData,
  type DiagnosticTraceContext,
} from "openclaw/plugin-sdk/diagnostic-runtime";
export { emptyPluginConfigSchema, type OperatorPluginApi } from "openclaw/plugin-sdk/plugin-entry";
export type {
  OperatorPluginService,
  OperatorPluginServiceContext,
} from "openclaw/plugin-sdk/plugin-entry";
export { redactSensitiveText } from "openclaw/plugin-sdk/security-runtime";
