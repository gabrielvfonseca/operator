const require_system_message = require("./system-message-DdLwjtBT.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/thread-bindings-messages.ts
/**
* Channel-neutral thread-binding message builders shared by plugins, ACP focus, and subagent flows.
* Keep text system-prefixed and compact because callers post it directly into user-visible threads.
*/
function normalizeThreadBindingDurationMs(raw) {
	if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
	const durationMs = Math.floor(raw);
	if (durationMs < 0) return 0;
	return durationMs;
}
/** Formats thread-binding timeout durations for compact user-facing messages. */
function formatThreadBindingDurationLabel(durationMs) {
	if (durationMs <= 0) return "disabled";
	if (durationMs < 6e4) return "<1m";
	const totalMinutes = Math.floor(durationMs / 6e4);
	if (totalMinutes % 60 === 0) return `${Math.floor(totalMinutes / 60)}h`;
	return `${totalMinutes}m`;
}
/** Builds the native thread name for a focused thread-bound session. */
function resolveThreadBindingThreadName(params) {
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(`🤖 ${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.label) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentId) || "agent"}`.replace(/\s+/g, " ").trim(), 100);
}
/** Builds the system-prefixed intro text posted when a thread binding becomes active. */
function resolveThreadBindingIntroText(params) {
	const normalized = (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.label) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentId) || "agent").replace(/\s+/g, " ").trim(), 100) || "agent";
	const idleTimeoutMs = normalizeThreadBindingDurationMs(params.idleTimeoutMs);
	const maxAgeMs = normalizeThreadBindingDurationMs(params.maxAgeMs);
	const cwd = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionCwd);
	const details = (params.sessionDetails ?? []).map((entry) => entry.trim()).filter((entry) => entry.length > 0);
	if (cwd) details.unshift(`cwd: ${cwd}`);
	const lifecycle = [];
	if (idleTimeoutMs > 0) lifecycle.push(`idle auto-unfocus after ${formatThreadBindingDurationLabel(idleTimeoutMs)} inactivity`);
	if (maxAgeMs > 0) lifecycle.push(`max age ${formatThreadBindingDurationLabel(maxAgeMs)}`);
	const intro = lifecycle.length > 0 ? `${normalized} session active (${lifecycle.join("; ")}). Messages here go directly to this session.` : `${normalized} session active. Messages here go directly to this session.`;
	if (details.length === 0) return require_system_message.prefixSystemMessage(intro);
	return require_system_message.prefixSystemMessage(`${intro}\n${details.join("\n")}`);
}
//#endregion
Object.defineProperty(exports, "formatThreadBindingDurationLabel", {
	enumerable: true,
	get: function() {
		return formatThreadBindingDurationLabel;
	}
});
Object.defineProperty(exports, "resolveThreadBindingIntroText", {
	enumerable: true,
	get: function() {
		return resolveThreadBindingIntroText;
	}
});
Object.defineProperty(exports, "resolveThreadBindingThreadName", {
	enumerable: true,
	get: function() {
		return resolveThreadBindingThreadName;
	}
});
