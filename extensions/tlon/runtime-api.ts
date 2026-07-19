// Private runtime barrel for the bundled Tlon extension.
// Keep this barrel thin and aligned with the local extension surface.

export type { ReplyPayload } from "@gabrielvfonseca/operator/plugin-sdk/reply-runtime";
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export { createDedupeCache } from "@gabrielvfonseca/operator/plugin-sdk/core";
export { createLoggerBackedRuntime } from "./src/logger-runtime.js";
export {
  fetchWithSsrFGuard,
  isBlockedHostnameOrIp,
  ssrfPolicyFromDangerouslyAllowPrivateNetwork,
  type LookupFn,
  type SsrFPolicy,
} from "@gabrielvfonseca/operator/plugin-sdk/ssrf-runtime";
export { SsrFBlockedError } from "@gabrielvfonseca/operator/plugin-sdk/ssrf-runtime";
