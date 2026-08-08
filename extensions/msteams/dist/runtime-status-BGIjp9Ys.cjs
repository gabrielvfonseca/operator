const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_tool_policy_audit = require("./tool-policy-audit-eHY9weCY.cjs");
const require_tool_policy = require("./tool-policy-DWNs5HaX.cjs");
const require_config = require("./config-DEJMoJiT.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/sandbox/runtime-status.ts
/**
* Sandbox runtime status and tool-policy diagnostics.
*
* Resolves whether a session is sandboxed and explains policy blocks before tool execution.
*/
function shouldSandboxSession(cfg, sessionKey, mainSessionKey) {
	if (cfg.mode === "off") return false;
	if (cfg.mode === "all") return true;
	return sessionKey.trim() !== mainSessionKey.trim();
}
function resolveMainSessionKeyForSandbox(params) {
	if (params.cfg?.session?.scope === "global") return "global";
	return require_main_session.resolveAgentMainSessionKey({
		cfg: params.cfg,
		agentId: params.agentId
	});
}
function resolveComparableSessionKeyForSandbox(params) {
	return require_main_session.canonicalizeMainSessionAlias({
		cfg: params.cfg,
		agentId: params.agentId,
		sessionKey: params.sessionKey
	});
}
/** Resolves sandbox mode, effective session scope, and tool policy for a session. */
function resolveSandboxRuntimeStatus(params) {
	const sessionKey = params.sessionKey?.trim() ?? "";
	const agentId = require_agent_scope.resolveSessionAgentId({
		sessionKey,
		config: params.cfg,
		agentId: params.agentId
	});
	const cfg = params.cfg;
	const sandboxCfg = require_config.resolveSandboxConfigForAgent(cfg, agentId);
	const mainSessionKey = resolveMainSessionKeyForSandbox({
		cfg,
		agentId
	});
	const sandboxed = sessionKey ? shouldSandboxSession(sandboxCfg, resolveComparableSessionKeyForSandbox({
		cfg,
		agentId,
		sessionKey
	}), mainSessionKey) : false;
	return {
		agentId,
		sessionKey,
		mainSessionKey,
		mode: sandboxCfg.mode,
		sandboxed,
		toolPolicy: require_tool_policy.resolveSandboxToolPolicyForAgent(cfg, agentId)
	};
}
function sanitizeForSingleLineDisplay(value) {
	return require_tool_policy_audit.escapeControlCharsVisible(value);
}
function hasUnsafeControlChars(value) {
	return Array.from(value).some((char) => {
		const codePoint = char.codePointAt(0) ?? 0;
		return codePoint < 32 || codePoint === 127;
	});
}
function redactSessionKey(value) {
	const trimmed = value.trim();
	if (!trimmed) return "(unknown)";
	if (trimmed.length <= 12) return "(redacted)";
	return `${sanitizeForSingleLineDisplay((0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(trimmed, 6))}…${sanitizeForSingleLineDisplay((0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(trimmed, -6))}`;
}
function shellEscapeSingleArg(value) {
	return `'${value.replaceAll("'", `'\\''`)}'`;
}
/** Formats the user-facing denial message when sandbox tool policy blocks a tool. */
function formatSandboxToolPolicyBlockedMessage(params) {
	const tool = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.toolName);
	if (!tool) return;
	const runtime = resolveSandboxRuntimeStatus({
		cfg: params.cfg,
		sessionKey: params.sessionKey
	});
	if (!runtime.sandboxed) return;
	const { blockedByDeny, blockedByAllow } = require_tool_policy.classifyToolAgainstSandboxToolPolicy(tool, runtime.toolPolicy);
	if (!blockedByDeny && !blockedByAllow) return;
	const blockingSource = blockedByDeny ? runtime.toolPolicy.sources.deny : runtime.toolPolicy.sources.allow;
	if (params.audit === true) require_tool_policy_audit.auditSandboxToolPolicyBlock({
		toolName: tool,
		ruleType: blockedByDeny ? "deny" : "allow",
		ruleSource: blockingSource.source,
		configKey: blockingSource.key,
		policy: runtime.toolPolicy,
		mode: runtime.mode
	});
	const reasons = [];
	const fixes = [];
	if (blockedByDeny) {
		reasons.push("deny list");
		fixes.push(`Remove "${tool}" from ${runtime.toolPolicy.sources.deny.key}.`);
	}
	if (blockedByAllow) {
		reasons.push("allow list");
		fixes.push(`Add "${tool}" to ${runtime.toolPolicy.sources.allow.key} (or set it to [] to allow all).`);
	}
	const lines = [];
	lines.push(`Tool "${tool}" blocked by sandbox tool policy (mode=${runtime.mode}).`);
	lines.push(`Session: ${redactSessionKey(runtime.sessionKey)}`);
	lines.push(`Reason: ${reasons.join(" + ")}`);
	lines.push("Fix:");
	lines.push(`- agents.defaults.sandbox.mode=off (disable sandbox)`);
	for (const fix of fixes) lines.push(`- ${fix}`);
	if (runtime.mode === "non-main") lines.push("- Use the agent main session instead of a non-main session.");
	const explainCommand = runtime.sessionKey ? hasUnsafeControlChars(runtime.sessionKey) ? `openclaw sandbox explain --agent ${runtime.agentId}` : `openclaw sandbox explain --session ${shellEscapeSingleArg(runtime.sessionKey)}` : "openclaw sandbox explain";
	lines.push(`- See: ${require_command_format.formatCliCommand(explainCommand)}`);
	return lines.join("\n");
}
//#endregion
Object.defineProperty(exports, "formatSandboxToolPolicyBlockedMessage", {
	enumerable: true,
	get: function() {
		return formatSandboxToolPolicyBlockedMessage;
	}
});
Object.defineProperty(exports, "resolveSandboxRuntimeStatus", {
	enumerable: true,
	get: function() {
		return resolveSandboxRuntimeStatus;
	}
});
