// Browser-safe gateway client surface. Keep Node transport/TLS dependencies out
// of this entry so browser consumers share the wire engine without polyfills.
export * from "./device-auth.js";
export * from "./connect-auth.js";
export * from "./protocol-client.js";
export * from "./reconnect-policy.js";
export * from "@operator/gateway-protocol/client-info";
export * from "@operator/gateway-protocol/connect-error-details";
export * from "@operator/gateway-protocol/startup-unavailable";
export * from "@operator/gateway-protocol/version";
export type { ConnectParams, ErrorShape, EventFrame, HelloOk } from "@operator/gateway-protocol";
