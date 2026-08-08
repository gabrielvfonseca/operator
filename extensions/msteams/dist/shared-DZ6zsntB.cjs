const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_command_turn_context = require("./command-turn-context-DgIVffox.cjs");
const require_sanitize_user_facing_text = require("./sanitize-user-facing-text-B2i4WcAm.cjs");
const require_subagent_capabilities = require("./subagent-capabilities-Bg6I8KeP.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_sessions_helpers = require("./sessions-helpers-BzXDIb2t.cjs");
const require_chat_history_text = require("./chat-history-text-D9KfJyJC.cjs");
const require_subagent_registry_state = require("./subagent-registry-state-Cb8uurME.cjs");
const require_subagents_utils = require("./subagents-utils-DU8qD7dC.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/commands-subagents-text.ts
/** Text extraction helpers for subagent command output. */
/** Extracts sanitized display text from a subagent chat message. */
function extractMessageText(message) {
	const role = typeof message.role === "string" ? message.role : "";
	const shouldSanitize = role === "assistant";
	const text = require_sanitize_user_facing_text.extractTextFromChatContent(message.content, { sanitizeText: shouldSanitize ? require_chat_history_text.sanitizeTextContent : void 0 });
	return text ? {
		role,
		text
	} : null;
}
//#endregion
//#region src/auto-reply/reply/commands-subagents/shared.ts
const COMMAND = "/subagents";
const COMMAND_FOCUS = "/focus";
const COMMAND_UNFOCUS = "/unfocus";
const COMMAND_AGENTS = "/agents";
const ACTIONS = /* @__PURE__ */ new Set([
	"list",
	"log",
	"info",
	"help"
]);
function stopWithText(text) {
	return {
		shouldContinue: false,
		reply: { text }
	};
}
function stopWithUnknownTargetError(error) {
	return stopWithText(`⚠️ ${error ?? "Unknown subagent."}`);
}
function resolveSubagentTarget(runs, token) {
	return require_subagents_utils.resolveSubagentTargetFromRuns({
		runs,
		token,
		recentWindowMinutes: 30,
		label: (entry) => require_subagents_utils.formatRunLabel(entry),
		aliases: (entry) => entry.taskName ? [entry.taskName] : [],
		isActive: (entry) => !entry.endedAt || Math.max(0, require_subagent_registry_state.countPendingDescendantRunsFromRuns(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns), entry.childSessionKey)) > 0,
		errors: {
			missingTarget: "Missing subagent id.",
			invalidIndex: (value) => `Invalid subagent index: ${value}`,
			unknownSession: (value) => `Unknown subagent session: ${value}`,
			ambiguousLabel: (value) => `Ambiguous subagent label: ${value}`,
			ambiguousLabelPrefix: (value) => `Ambiguous subagent label prefix: ${value}`,
			ambiguousRunIdPrefix: (value) => `Ambiguous run id prefix: ${value}`,
			unknownTarget: (value) => `Unknown subagent id: ${value}`
		}
	});
}
function resolveSubagentEntryForToken(runs, token) {
	const resolved = resolveSubagentTarget(runs, token);
	if (!resolved.entry) return { reply: stopWithUnknownTargetError(resolved.error) };
	return { entry: resolved.entry };
}
function resolveRequesterSessionKey(params, opts) {
	const commandTarget = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.ctx.CommandTargetSessionKey);
	const commandSession = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
	const raw = opts?.preferCommandTarget ?? require_command_turn_context.isNativeCommandTurn(require_command_turn_context.resolveCommandTurnContext(params.ctx)) ? commandTarget || commandSession : commandSession || commandTarget;
	if (!raw) return;
	const { mainKey, alias } = require_sessions_helpers.resolveMainSessionAlias(params.cfg);
	return require_sessions_helpers.resolveInternalSessionKey({
		key: raw,
		alias,
		mainKey
	});
}
function resolveCommandSubagentController(params, requesterKey) {
	if (!require_session_key.isSubagentSessionKey(requesterKey)) return {
		controllerSessionKey: requesterKey,
		callerSessionKey: requesterKey,
		callerIsSubagent: false,
		controlScope: "children"
	};
	return {
		controllerSessionKey: requesterKey,
		callerSessionKey: requesterKey,
		callerIsSubagent: true,
		controlScope: require_subagent_capabilities.resolveStoredSubagentCapabilities(requesterKey, { cfg: params.cfg }).controlScope
	};
}
function resolveHandledPrefix(normalized) {
	return normalized.startsWith(COMMAND) ? COMMAND : normalized.startsWith(COMMAND_FOCUS) ? COMMAND_FOCUS : normalized.startsWith(COMMAND_UNFOCUS) ? COMMAND_UNFOCUS : normalized.startsWith(COMMAND_AGENTS) ? COMMAND_AGENTS : null;
}
function resolveSubagentsAction(params) {
	if (params.handledPrefix === COMMAND) {
		const [actionRaw] = params.restTokens;
		const action = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(actionRaw) || "list";
		if (!ACTIONS.has(action)) return null;
		params.restTokens.splice(0, 1);
		return action;
	}
	if (params.handledPrefix === COMMAND_FOCUS) return "focus";
	if (params.handledPrefix === COMMAND_UNFOCUS) return "unfocus";
	if (params.handledPrefix === COMMAND_AGENTS) return "agents";
	return null;
}
async function resolveFocusTargetSession(params) {
	const subagentMatch = resolveSubagentTarget(params.runs, params.token);
	if (subagentMatch.entry) {
		const key = subagentMatch.entry.childSessionKey;
		return {
			targetKind: "subagent",
			targetSessionKey: key,
			agentId: require_session_key.parseAgentSessionKey(key)?.agentId ?? "main",
			label: require_subagents_utils.formatRunLabel(subagentMatch.entry)
		};
	}
	const token = params.token.trim();
	if (!token) return null;
	const attempts = [];
	const requesterKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterKey);
	const spawnedBy = requesterKey && require_session_key.isSubagentSessionKey(requesterKey) ? requesterKey : void 0;
	attempts.push({ key: token });
	if (require_sessions_helpers.looksLikeSessionId(token)) attempts.push({ sessionId: token });
	attempts.push({ label: token });
	for (const attempt of attempts) try {
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((await require_call.callGateway({
			method: "sessions.resolve",
			params: spawnedBy ? {
				...attempt,
				spawnedBy
			} : attempt
		}))?.key) ?? "";
		if (!key) continue;
		const parsed = require_session_key.parseAgentSessionKey(key);
		return {
			targetKind: key.includes(":subagent:") ? "subagent" : "acp",
			targetSessionKey: key,
			agentId: parsed?.agentId ?? "main",
			label: token
		};
	} catch {}
	return null;
}
function buildSubagentsHelp() {
	return [
		"Subagents",
		"Usage:",
		"- /subagents list",
		"- /subagents log <id|#> [limit] [tools]",
		"- /subagents info <id|#>",
		"- /focus <subagent-label|session-key|session-id|session-label>",
		"- /unfocus",
		"- /agents",
		"- /session idle <duration|off>",
		"- /session max-age <duration|off>",
		"",
		"Ids: use the list index (#), runId/session prefix, label, or full session key."
	].join("\n");
}
function formatLogLines(messages) {
	const lines = [];
	for (const msg of messages) {
		const extracted = extractMessageText(msg);
		if (!extracted) continue;
		const label = extracted.role === "assistant" ? "Assistant" : "User";
		lines.push(`${label}: ${extracted.text}`);
	}
	return lines;
}
//#endregion
Object.defineProperty(exports, "buildSubagentsHelp", {
	enumerable: true,
	get: function() {
		return buildSubagentsHelp;
	}
});
Object.defineProperty(exports, "formatLogLines", {
	enumerable: true,
	get: function() {
		return formatLogLines;
	}
});
Object.defineProperty(exports, "resolveCommandSubagentController", {
	enumerable: true,
	get: function() {
		return resolveCommandSubagentController;
	}
});
Object.defineProperty(exports, "resolveFocusTargetSession", {
	enumerable: true,
	get: function() {
		return resolveFocusTargetSession;
	}
});
Object.defineProperty(exports, "resolveHandledPrefix", {
	enumerable: true,
	get: function() {
		return resolveHandledPrefix;
	}
});
Object.defineProperty(exports, "resolveRequesterSessionKey", {
	enumerable: true,
	get: function() {
		return resolveRequesterSessionKey;
	}
});
Object.defineProperty(exports, "resolveSubagentEntryForToken", {
	enumerable: true,
	get: function() {
		return resolveSubagentEntryForToken;
	}
});
Object.defineProperty(exports, "resolveSubagentsAction", {
	enumerable: true,
	get: function() {
		return resolveSubagentsAction;
	}
});
Object.defineProperty(exports, "stopWithText", {
	enumerable: true,
	get: function() {
		return stopWithText;
	}
});
