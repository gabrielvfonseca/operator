require("./rolldown-runtime-u92d-OFm.cjs");
require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_session_binding_service = require("./session-binding-service-Bu6XDLmS.cjs");
const require_subagent_registry_state = require("./subagent-registry-state-Cb8uurME.cjs");
const require_subagents_utils = require("./subagents-utils-DU8qD7dC.cjs");
const require_shared = require("./shared-DZ6zsntB.cjs");
const require_channel_context = require("./channel-context-C8y2HxPS.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/commands-subagents/action-agents.ts
function formatConversationBindingText(params) {
	return `binding:${params.conversationId}`;
}
function supportsConversationBindings(channel) {
	const channelId = require_registry.normalizeChannelId(channel);
	if (!channelId) return false;
	return require_registry.getChannelPlugin(channelId)?.conversationBindings?.supportsCurrentConversationBinding === true;
}
function handleSubagentsAgentsAction(ctx) {
	const { params, requesterKey, runs } = ctx;
	const runsSnapshot = require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns);
	const channel = require_channel_context.resolveCommandSurfaceChannel(params);
	const accountId = require_channel_context.resolveChannelAccountId(params);
	const currentConversationBindingsSupported = supportsConversationBindings(channel);
	const bindingService = require_session_binding_service.getSessionBindingService();
	const bindingsBySession = /* @__PURE__ */ new Map();
	const resolveSessionBindings = (sessionKey) => {
		const cached = bindingsBySession.get(sessionKey);
		if (cached) return cached;
		const resolved = bindingService.listBySession(sessionKey).filter((entry) => entry.status === "active" && entry.conversation.channel === channel && entry.conversation.accountId === accountId);
		bindingsBySession.set(sessionKey, resolved);
		return resolved;
	};
	const dedupedRuns = [];
	const seenChildSessionKeys = /* @__PURE__ */ new Set();
	for (const entry of require_subagents_utils.sortSubagentRuns(runs)) {
		if (seenChildSessionKeys.has(entry.childSessionKey)) continue;
		seenChildSessionKeys.add(entry.childSessionKey);
		dedupedRuns.push(entry);
	}
	const recentCutoff = Date.now() - 30 * 6e4;
	const numericOrder = [...dedupedRuns.filter((entry) => !entry.endedAt || require_subagent_registry_state.countPendingDescendantRunsFromRuns(runsSnapshot, entry.childSessionKey) > 0), ...dedupedRuns.filter((entry) => entry.endedAt && require_subagent_registry_state.countPendingDescendantRunsFromRuns(runsSnapshot, entry.childSessionKey) === 0 && entry.endedAt >= recentCutoff)];
	const indexByChildSessionKey = new Map(numericOrder.map((entry, idx) => [entry.childSessionKey, idx + 1]));
	const visibleRuns = [];
	for (const entry of dedupedRuns) {
		if (!(!entry.endedAt || require_subagent_registry_state.countPendingDescendantRunsFromRuns(runsSnapshot, entry.childSessionKey) > 0 || resolveSessionBindings(entry.childSessionKey).length > 0)) continue;
		visibleRuns.push(entry);
	}
	const lines = ["agents:", "-----"];
	if (visibleRuns.length === 0) lines.push("(none)");
	else for (const entry of visibleRuns) {
		const binding = resolveSessionBindings(entry.childSessionKey)[0];
		const bindingText = binding ? formatConversationBindingText({ conversationId: binding.conversation.conversationId }) : currentConversationBindingsSupported ? "unbound" : "bindings unavailable";
		const resolvedIndex = indexByChildSessionKey.get(entry.childSessionKey);
		const prefix = resolvedIndex ? `${resolvedIndex}.` : "-";
		lines.push(`${prefix} ${require_subagents_utils.formatRunLabel(entry)} (${bindingText})`);
	}
	const requesterBindings = resolveSessionBindings(requesterKey).filter((entry) => entry.targetKind === "session");
	if (requesterBindings.length > 0) {
		lines.push("", "acp/session bindings:", "-----");
		for (const binding of requesterBindings) {
			const label = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.metadata?.label) ?? binding.targetSessionKey;
			lines.push(`- ${label} (${formatConversationBindingText({ conversationId: binding.conversation.conversationId })}, session:${binding.targetSessionKey})`);
		}
	}
	return require_shared.stopWithText(lines.join("\n"));
}
//#endregion
exports.handleSubagentsAgentsAction = handleSubagentsAgentsAction;
