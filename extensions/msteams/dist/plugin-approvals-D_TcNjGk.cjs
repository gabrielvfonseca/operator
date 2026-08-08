//#region src/infra/plugin-approvals.ts
const DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS = 12e4;
const MAX_PLUGIN_APPROVAL_TIMEOUT_MS = 6e5;
const DEFAULT_PLUGIN_APPROVAL_DECISIONS = [
	"allow-once",
	"allow-always",
	"deny"
];
/** Clamp a plugin approval timeout to the supported runtime bounds. */
function resolvePluginApprovalTimeoutMs(value) {
	return Math.min(MAX_PLUGIN_APPROVAL_TIMEOUT_MS, Math.max(1, Math.floor(typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS)));
}
/** Format an approval decision for user-facing messages. */
function approvalDecisionLabel(decision) {
	if (decision === "allow-once") return "allowed once";
	if (decision === "allow-always") return "allowed always";
	return "denied";
}
/** Resolve explicit plugin approval decisions or fall back to defaults. */
function resolvePluginApprovalRequestAllowedDecisions(params) {
	const explicit = [];
	if (Array.isArray(params?.allowedDecisions)) {
		for (const decision of params.allowedDecisions) if ((decision === "allow-once" || decision === "allow-always" || decision === "deny") && !explicit.includes(decision)) explicit.push(decision);
	}
	return explicit.length > 0 ? explicit : DEFAULT_PLUGIN_APPROVAL_DECISIONS;
}
/** Build the pending plugin approval message. */
function buildPluginApprovalRequestMessage(request, nowMsValue) {
	const lines = [];
	const severity = request.request.severity ?? "warning";
	const icon = severity === "critical" ? "🚨" : severity === "info" ? "ℹ️" : "🛡️";
	lines.push(`${icon} Plugin approval required`);
	lines.push(`Title: ${request.request.title}`);
	lines.push(`Description: ${request.request.description}`);
	if (request.request.toolName) lines.push(`Tool: ${request.request.toolName}`);
	if (request.request.pluginId) lines.push(`Plugin: ${request.request.pluginId}`);
	if (request.request.agentId) lines.push(`Agent: ${request.request.agentId}`);
	lines.push(`ID: ${request.id}`);
	const expiresIn = Math.max(0, Math.round((request.expiresAtMs - nowMsValue) / 1e3));
	lines.push(`Expires in: ${expiresIn}s`);
	lines.push(`Reply with: /approve ${request.id} ${resolvePluginApprovalRequestAllowedDecisions(request.request).join("|")}`);
	return lines.join("\n");
}
/** Build the plugin approval resolution message. */
function buildPluginApprovalResolvedMessage(resolved) {
	return `${`✅ Plugin approval ${approvalDecisionLabel(resolved.decision)}.`}${resolved.resolvedBy ? ` Resolved by ${resolved.resolvedBy}.` : ""} ID: ${resolved.id}`;
}
/** Build the plugin approval expiration message. */
function buildPluginApprovalExpiredMessage(request) {
	return `⏱️ Plugin approval expired. ID: ${request.id}`;
}
//#endregion
Object.defineProperty(exports, "DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "MAX_PLUGIN_APPROVAL_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return MAX_PLUGIN_APPROVAL_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "approvalDecisionLabel", {
	enumerable: true,
	get: function() {
		return approvalDecisionLabel;
	}
});
Object.defineProperty(exports, "buildPluginApprovalExpiredMessage", {
	enumerable: true,
	get: function() {
		return buildPluginApprovalExpiredMessage;
	}
});
Object.defineProperty(exports, "buildPluginApprovalRequestMessage", {
	enumerable: true,
	get: function() {
		return buildPluginApprovalRequestMessage;
	}
});
Object.defineProperty(exports, "buildPluginApprovalResolvedMessage", {
	enumerable: true,
	get: function() {
		return buildPluginApprovalResolvedMessage;
	}
});
Object.defineProperty(exports, "resolvePluginApprovalRequestAllowedDecisions", {
	enumerable: true,
	get: function() {
		return resolvePluginApprovalRequestAllowedDecisions;
	}
});
Object.defineProperty(exports, "resolvePluginApprovalTimeoutMs", {
	enumerable: true,
	get: function() {
		return resolvePluginApprovalTimeoutMs;
	}
});
