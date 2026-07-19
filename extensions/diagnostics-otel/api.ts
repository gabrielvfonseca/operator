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
} from "@gabrielvfonseca/operator/plugin-sdk/diagnostic-runtime";
export {
  emptyPluginConfigSchema,
  type OperatorPluginApi,
} from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
export type {
  OperatorPluginService,
  OperatorPluginServiceContext,
} from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
export { redactSensitiveText } from "@gabrielvfonseca/operator/plugin-sdk/security-runtime";
