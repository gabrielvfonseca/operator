// Private runtime barrel for the bundled Voice Call extension.
// Keep this barrel thin and aligned with the local extension surface.

export { definePluginEntry } from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
export type { OperatorPluginApi } from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
export type { GatewayRequestHandlerOptions } from "@gabrielvfonseca/operator/plugin-sdk/gateway-runtime";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "@gabrielvfonseca/operator/plugin-sdk/webhook-request-guards";
export {
  fetchWithSsrFGuard,
  isBlockedHostnameOrIp,
} from "@gabrielvfonseca/operator/plugin-sdk/ssrf-runtime";
export type { SessionEntry } from "@gabrielvfonseca/operator/plugin-sdk/session-store-runtime";
export {
  TtsAutoSchema,
  TtsConfigSchema,
  TtsModeSchema,
  TtsProviderSchema,
} from "@gabrielvfonseca/operator/plugin-sdk/tts-runtime";
export { sleep } from "@gabrielvfonseca/operator/plugin-sdk/runtime-env";
