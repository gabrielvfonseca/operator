// Diagnostics Prometheus API module exposes the plugin public contract.
export type {
  DiagnosticEventMetadata,
  DiagnosticEventPayload,
} from "openclaw/plugin-sdk/diagnostic-runtime";
export { isInternalDiagnosticEventMetadata } from "openclaw/plugin-sdk/diagnostic-runtime";
export {
  emptyPluginConfigSchema,
  type OperatorPluginApi,
  type OperatorPluginHttpRouteHandler,
  type OperatorPluginService,
  type OperatorPluginServiceContext,
} from "openclaw/plugin-sdk/plugin-entry";
export { redactSensitiveText } from "openclaw/plugin-sdk/security-runtime";
