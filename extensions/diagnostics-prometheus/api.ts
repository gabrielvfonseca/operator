// Diagnostics Prometheus API module exposes the plugin public contract.
export type {
  DiagnosticEventMetadata,
  DiagnosticEventPayload,
} from "@gabrielvfonseca/operator/plugin-sdk/diagnostic-runtime";
export { isInternalDiagnosticEventMetadata } from "@gabrielvfonseca/operator/plugin-sdk/diagnostic-runtime";
export {
  emptyPluginConfigSchema,
  type OperatorPluginApi,
  type OperatorPluginHttpRouteHandler,
  type OperatorPluginService,
  type OperatorPluginServiceContext,
} from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
export { redactSensitiveText } from "@gabrielvfonseca/operator/plugin-sdk/security-runtime";
