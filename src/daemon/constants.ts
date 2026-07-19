/** Cross-platform daemon service names, labels, and profile-aware descriptions. */
import { normalizeLowercaseStringOrEmpty } from "@operator/normalization-core/string-coerce";

// Default service labels (canonical + legacy compatibility)
export const GATEWAY_LAUNCH_AGENT_LABEL = "ai.operator.gateway";
const GATEWAY_SYSTEMD_SERVICE_NAME = "operator-gateway";
const GATEWAY_WINDOWS_TASK_NAME = "Operator Gateway";
export const GATEWAY_SERVICE_MARKER = "operator";
export const GATEWAY_SERVICE_KIND = "gateway";
export const GATEWAY_SERVICE_RUNTIME_PID_ENV = "OPERATOR_GATEWAY_SERVICE_PID";
const NODE_LAUNCH_AGENT_LABEL = "ai.operator.node";
const NODE_SYSTEMD_SERVICE_NAME = "operator-node";
const NODE_WINDOWS_TASK_NAME = "Operator Node";
export const NODE_SERVICE_MARKER = "operator";
export const NODE_SERVICE_KIND = "node";
export const NODE_WINDOWS_TASK_SCRIPT_NAME = "node.cmd";
export const LEGACY_GATEWAY_SYSTEMD_SERVICE_NAMES: string[] = ["clawdbot-gateway"];

function normalizeGatewayProfile(profile?: string): string | null {
  const trimmed = profile?.trim();
  if (!trimmed || normalizeLowercaseStringOrEmpty(trimmed) === "default") {
    // The default profile keeps the historical unqualified service names.
    return null;
  }
  return trimmed;
}

export function resolveGatewayProfileSuffix(profile?: string): string {
  const normalized = normalizeGatewayProfile(profile);
  return normalized ? `-${normalized}` : "";
}

export function resolveGatewayLaunchAgentLabel(profile?: string): string {
  const normalized = normalizeGatewayProfile(profile);
  if (!normalized) {
    return GATEWAY_LAUNCH_AGENT_LABEL;
  }
  return `ai.operator.${normalized}`;
}

export function resolveLegacyGatewayLaunchAgentLabels(profile?: string): string[] {
  void profile;
  return [];
}

export function resolveGatewaySystemdServiceName(profile?: string): string {
  const suffix = resolveGatewayProfileSuffix(profile);
  if (!suffix) {
    return GATEWAY_SYSTEMD_SERVICE_NAME;
  }
  return `operator-gateway${suffix}`;
}

export function resolveGatewayWindowsTaskName(profile?: string): string {
  const normalized = normalizeGatewayProfile(profile);
  if (!normalized) {
    return GATEWAY_WINDOWS_TASK_NAME;
  }
  return `Operator Gateway (${normalized})`;
}

function formatGatewayServiceDescription(params?: { profile?: string; version?: string }): string {
  const profile = normalizeGatewayProfile(params?.profile);
  const version = params?.version?.trim();
  const parts: string[] = [];
  if (profile) {
    parts.push(`profile: ${profile}`);
  }
  if (version) {
    parts.push(`v${version}`);
  }
  if (parts.length === 0) {
    return "Operator Gateway";
  }
  return `Operator Gateway (${parts.join(", ")})`;
}

export function resolveGatewayServiceDescription(params: {
  env: Record<string, string | undefined>;
  environment?: Record<string, string | undefined>;
  description?: string;
}): string {
  return (
    params.description ??
    formatGatewayServiceDescription({
      profile: params.env.OPERATOR_PROFILE,
      version: params.environment?.OPERATOR_SERVICE_VERSION ?? params.env.OPERATOR_SERVICE_VERSION,
    })
  );
}

export function resolveNodeLaunchAgentLabel(): string {
  return NODE_LAUNCH_AGENT_LABEL;
}

export function resolveNodeSystemdServiceName(): string {
  return NODE_SYSTEMD_SERVICE_NAME;
}

export function resolveNodeWindowsTaskName(): string {
  return NODE_WINDOWS_TASK_NAME;
}

export function formatNodeServiceDescription(params?: { version?: string }): string {
  const version = params?.version?.trim();
  if (!version) {
    return "Operator Node Host";
  }
  return `Operator Node Host (v${version})`;
}
