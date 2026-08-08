const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_session_runtime_compat = require("./session-runtime-compat-B8Zu61mN.cjs");
const require_system_message = require("./system-message-DdLwjtBT.cjs");
const require_session_snapshot_merge = require("./session-snapshot-merge-BloJoO_g.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/directive-handling.model-runtime.ts
/** Resolves and applies explicit runtime selections attached to `/model`. */
/** Validates a requested runtime against the provider selected by the same directive. */
function resolveModelRuntimeDirective(params) {
	const rawRuntime = params.rawRuntime?.trim();
	if (!rawRuntime) {
		if (params.sessionEntry?.agentRuntimeOverride?.trim() && !require_session_runtime_compat.resolveSessionRuntimeOverrideForProvider({
			provider: params.provider,
			entry: params.sessionEntry,
			cfg: params.cfg
		})) return { kind: "clear" };
		return { kind: "unchanged" };
	}
	const runtime = require_openai_routing.normalizeOptionalAgentRuntimeId(rawRuntime);
	if (require_openai_routing.isDefaultAgentRuntimeId(runtime)) return { kind: "clear" };
	const provider = require_model_selection_normalize.normalizeProviderId(params.provider);
	const compatibleRuntime = require_session_runtime_compat.resolveCompatibleAgentRuntimeForProvider({
		provider,
		runtime,
		cfg: params.cfg
	});
	if (compatibleRuntime) return {
		kind: "set",
		runtime: compatibleRuntime
	};
	return {
		kind: "invalid",
		runtime: rawRuntime,
		errorText: `Runtime "${rawRuntime}" is not supported for ${provider || params.provider}.`
	};
}
/** Applies a validated runtime choice without disturbing existing pins when no choice was given. */
function applyModelRuntimeDirective(entry, resolution) {
	if (resolution.kind === "clear") {
		const updated = entry.agentRuntimeOverride !== void 0;
		delete entry.agentRuntimeOverride;
		return { updated };
	}
	if (resolution.kind === "set") {
		const updated = entry.agentRuntimeOverride !== resolution.runtime;
		entry.agentRuntimeOverride = resolution.runtime;
		return { updated };
	}
	return { updated: false };
}
//#endregion
//#region src/auto-reply/reply/directive-handling.shared.ts
const formatDirectiveAck = (text) => {
	return require_system_message.prefixSystemMessage(text);
};
const formatOptionsLine = (options) => `Options: ${options}.`;
const withOptions = (line, options) => `${line}\n${formatOptionsLine(options)}`;
const formatElevatedRuntimeHint = () => `${require_system_message.SYSTEM_MARK} Runtime is direct; sandboxing does not apply.`;
const formatInternalExecPersistenceDeniedText = () => "Exec defaults require operator.admin for gateway callers; skipped persistence.";
const formatInternalVerbosePersistenceDeniedText = () => "Verbose defaults require operator.admin for gateway callers; skipped persistence.";
const formatInternalVerboseCurrentReplyOnlyText = () => "Verbose logging set for the current reply only.";
function canPersistSessionDirectiveDefaults(params) {
	const messageProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageProvider);
	const surface = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.surface);
	const authoritativeChannel = messageProvider ?? surface;
	if (!authoritativeChannel) return true;
	if (require_message_channel.isInternalMessageChannel(authoritativeChannel)) return params.gatewayClientScopes?.includes("operator.admin") === true;
	return params.commandAuthorized === true || params.senderIsOwner === true;
}
/** Names explicit directive writes that snapshot equality cannot infer. */
function resolveDirectiveTouchedSessionFields(params) {
	const { directives } = params;
	const fields = /* @__PURE__ */ new Set();
	if (directives.hasThinkDirective) fields.add("thinkingLevel");
	if (directives.hasFastDirective) fields.add("fastMode");
	if (directives.hasVerboseDirective && params.allowInternalVerbosePersistence) fields.add("verboseLevel");
	if (directives.hasTraceDirective) fields.add("traceLevel");
	if (directives.hasReasoningDirective) fields.add("reasoningLevel");
	if (directives.hasElevatedDirective) fields.add("elevatedLevel");
	if (directives.hasModelDirective) for (const field of require_session_snapshot_merge.SESSION_MODEL_OVERRIDE_TRANSACTION_FIELDS) fields.add(field);
	if (directives.hasExecDirective && params.allowInternalExecPersistence) {
		if (directives.execHost) fields.add("execHost");
		if (directives.execSecurity) fields.add("execSecurity");
		if (directives.execAsk) fields.add("execAsk");
		if (directives.execNode) fields.add("execNode");
	}
	if (directives.hasQueueDirective) {
		if (directives.queueReset || directives.queueMode) fields.add("queueMode");
		if (directives.queueReset || typeof directives.debounceMs === "number") fields.add("queueDebounceMs");
		if (directives.queueReset || typeof directives.cap === "number") fields.add("queueCap");
		if (directives.queueReset || directives.dropPolicy) fields.add("queueDrop");
	}
	return [...fields];
}
const formatElevatedEvent = (level) => {
	if (level === "full") return "Elevated FULL - exec runs on host with auto-approval.";
	if (level === "ask" || level === "on") return "Elevated ASK - exec runs on host; approvals may still apply.";
	return "Elevated OFF - exec stays in sandbox.";
};
const formatReasoningEvent = (level) => {
	if (level === "stream") return "Reasoning STREAM - emit live <think>.";
	if (level === "on") return "Reasoning ON - include <think>.";
	return "Reasoning OFF - hide <think>.";
};
function enqueueModeSwitchEvents(params) {
	if (params.elevatedChanged) {
		const nextElevated = params.sessionEntry.elevatedLevel ?? "off";
		params.enqueueSystemEvent(formatElevatedEvent(nextElevated), {
			sessionKey: params.sessionKey,
			contextKey: "mode:elevated"
		});
	}
	if (params.reasoningChanged) {
		const nextReasoning = params.sessionEntry.reasoningLevel ?? "off";
		params.enqueueSystemEvent(formatReasoningEvent(nextReasoning), {
			sessionKey: params.sessionKey,
			contextKey: "mode:reasoning"
		});
	}
}
function formatElevatedUnavailableText(params) {
	const lines = [];
	lines.push(`elevated is not available right now (runtime=${params.runtimeSandboxed ? "sandboxed" : "direct"}).`);
	const failures = params.failures ?? [];
	if (failures.length > 0) lines.push(`Failing gates: ${failures.map((f) => `${f.gate} (${f.key})`).join(", ")}`);
	else lines.push("Fix-it keys: tools.elevated.enabled, tools.elevated.allowFrom.<provider>, agents.list[].tools.elevated.*");
	if (params.sessionKey) lines.push(`See: ${require_command_format.formatCliCommand(`openclaw sandbox explain --session ${params.sessionKey}`)}`);
	return lines.join("\n");
}
//#endregion
Object.defineProperty(exports, "applyModelRuntimeDirective", {
	enumerable: true,
	get: function() {
		return applyModelRuntimeDirective;
	}
});
Object.defineProperty(exports, "canPersistSessionDirectiveDefaults", {
	enumerable: true,
	get: function() {
		return canPersistSessionDirectiveDefaults;
	}
});
Object.defineProperty(exports, "enqueueModeSwitchEvents", {
	enumerable: true,
	get: function() {
		return enqueueModeSwitchEvents;
	}
});
Object.defineProperty(exports, "formatDirectiveAck", {
	enumerable: true,
	get: function() {
		return formatDirectiveAck;
	}
});
Object.defineProperty(exports, "formatElevatedRuntimeHint", {
	enumerable: true,
	get: function() {
		return formatElevatedRuntimeHint;
	}
});
Object.defineProperty(exports, "formatElevatedUnavailableText", {
	enumerable: true,
	get: function() {
		return formatElevatedUnavailableText;
	}
});
Object.defineProperty(exports, "formatInternalExecPersistenceDeniedText", {
	enumerable: true,
	get: function() {
		return formatInternalExecPersistenceDeniedText;
	}
});
Object.defineProperty(exports, "formatInternalVerboseCurrentReplyOnlyText", {
	enumerable: true,
	get: function() {
		return formatInternalVerboseCurrentReplyOnlyText;
	}
});
Object.defineProperty(exports, "formatInternalVerbosePersistenceDeniedText", {
	enumerable: true,
	get: function() {
		return formatInternalVerbosePersistenceDeniedText;
	}
});
Object.defineProperty(exports, "resolveDirectiveTouchedSessionFields", {
	enumerable: true,
	get: function() {
		return resolveDirectiveTouchedSessionFields;
	}
});
Object.defineProperty(exports, "resolveModelRuntimeDirective", {
	enumerable: true,
	get: function() {
		return resolveModelRuntimeDirective;
	}
});
Object.defineProperty(exports, "withOptions", {
	enumerable: true,
	get: function() {
		return withOptions;
	}
});
