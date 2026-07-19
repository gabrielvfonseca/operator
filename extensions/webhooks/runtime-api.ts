// Webhooks API module exposes the plugin public contract.
export {
  createFixedWindowRateLimiter,
  createWebhookInFlightLimiter,
  normalizeWebhookPath,
  readJsonWebhookBodyOrReject,
  resolveRequestClientIp,
  resolveWebhookTargetWithAuthOrReject,
  resolveWebhookTargetWithAuthOrRejectSync,
  withResolvedWebhookRequestPipeline,
  WEBHOOK_IN_FLIGHT_DEFAULTS,
  WEBHOOK_RATE_LIMIT_DEFAULTS,
  type WebhookInFlightLimiter,
} from "@gabrielvfonseca/operator/plugin-sdk/webhook-ingress";
export { resolveConfiguredSecretInputString } from "@gabrielvfonseca/operator/plugin-sdk/secret-input-runtime";
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
