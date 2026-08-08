const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_cli_session_binding = require("./cli-session-binding-BLYmlDx8.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/agents/cli-session.ts
/**
* CLI session persistence helpers.
* Keeps provider-keyed session bindings, reuse fingerprints, and legacy
* Claude CLI state in one normalized session-store contract.
*/
const CLAUDE_CLI_BACKEND_ID = "claude-cli";
/** Hash CLI session-sensitive text so reuse checks can compare stable fingerprints. */
function hashCliSessionText(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return;
	return node_crypto.default.createHash("sha256").update(trimmed).digest("hex");
}
/** Store a reusable CLI session ID without extra reuse guards. */
function setCliSessionId(entry, provider, sessionId) {
	setCliSessionBinding(entry, provider, { sessionId });
}
/** Store a CLI session binding and mirror it to legacy/simple session-id fields. */
function setCliSessionBinding(entry, provider, binding) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	const trimmed = binding.sessionId.trim();
	if (!trimmed) return;
	const previousBinding = entry.cliSessionBindings?.[normalized];
	const previousReceipt = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(previousBinding?.sessionId) === trimmed ? require_cli_session_binding.normalizeCliSessionReseedReceipt(previousBinding?.reseedReceipt) : void 0;
	const reseedReceipt = require_cli_session_binding.normalizeCliSessionReseedReceipt(binding.reseedReceipt) ?? previousReceipt;
	entry.cliSessionBindings = {
		...entry.cliSessionBindings,
		[normalized]: {
			sessionId: trimmed,
			...binding.forceReuse === true ? { forceReuse: true } : {},
			...binding.forkNextResume === true ? { forkNextResume: true } : {},
			...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.authProfileId) ? { authProfileId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.authProfileId) } : {},
			...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.authEpoch) ? { authEpoch: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.authEpoch) } : {},
			...typeof binding.authEpochVersion === "number" && Number.isFinite(binding.authEpochVersion) ? { authEpochVersion: binding.authEpochVersion } : {},
			...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.extraSystemPromptHash) ? { extraSystemPromptHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.extraSystemPromptHash) } : {},
			...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.messageToolPolicyHash) ? { messageToolPolicyHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.messageToolPolicyHash) } : {},
			...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.promptToolNamesHash) ? { promptToolNamesHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.promptToolNamesHash) } : {},
			...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.cwdHash) ? { cwdHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.cwdHash) } : {},
			...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.mcpConfigHash) ? { mcpConfigHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.mcpConfigHash) } : {},
			...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.mcpResumeHash) ? { mcpResumeHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.mcpResumeHash) } : {},
			...reseedReceipt ? { reseedReceipt } : {}
		}
	};
	entry.cliSessionIds = {
		...entry.cliSessionIds,
		[normalized]: trimmed
	};
	if (normalized === CLAUDE_CLI_BACKEND_ID) entry.claudeCliSessionId = trimmed;
}
/** Remove the stored CLI session binding for one provider. */
function clearCliSession(entry, provider) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	if (entry.cliSessionBindings?.[normalized] !== void 0) {
		const next = { ...entry.cliSessionBindings };
		delete next[normalized];
		entry.cliSessionBindings = Object.keys(next).length > 0 ? next : void 0;
	}
	if (entry.cliSessionIds?.[normalized] !== void 0) {
		const next = { ...entry.cliSessionIds };
		delete next[normalized];
		entry.cliSessionIds = Object.keys(next).length > 0 ? next : void 0;
	}
	if (normalized === CLAUDE_CLI_BACKEND_ID) entry.claudeCliSessionId = void 0;
}
/** Remove every CLI session binding from a session entry. */
function clearAllCliSessions(entry) {
	entry.cliSessionBindings = void 0;
	entry.cliSessionIds = void 0;
	entry.claudeCliSessionId = void 0;
}
/** Decide whether a stored CLI session can be reused for the current auth/prompt/cwd/MCP state. */
function resolveCliSessionReuse(params) {
	const binding = params.binding;
	const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding?.sessionId);
	if (!sessionId) return { mode: "none" };
	if (binding?.forceReuse === true) return {
		mode: "reuse",
		sessionId
	};
	const currentAuthProfileId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.authProfileId);
	const currentAuthEpoch = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.authEpoch);
	const currentExtraSystemPromptHash = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.extraSystemPromptHash);
	const currentMessageToolPolicyHash = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageToolPolicyHash);
	const currentPromptToolNamesHash = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.promptToolNamesHash);
	const currentCwdHash = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.cwdHash);
	const currentMcpConfigHash = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.mcpConfigHash);
	const currentMcpResumeHash = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.mcpResumeHash);
	const storedAuthProfileId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding?.authProfileId);
	const storedAuthEpoch = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding?.authEpoch);
	const hasMatchingVersionedAuthEpoch = binding?.authEpochVersion === params.authEpochVersion && storedAuthEpoch !== void 0 && currentAuthEpoch !== void 0 && storedAuthEpoch === currentAuthEpoch;
	if (storedAuthProfileId !== currentAuthProfileId) {
		if (!hasMatchingVersionedAuthEpoch) return {
			mode: "invalidate",
			invalidatedReason: "auth-profile"
		};
	}
	if (binding?.authEpochVersion === params.authEpochVersion && storedAuthEpoch !== currentAuthEpoch) return {
		mode: "invalidate",
		invalidatedReason: "auth-epoch"
	};
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding?.messageToolPolicyHash) !== currentMessageToolPolicyHash) return {
		mode: "invalidate",
		invalidatedReason: "message-policy"
	};
	const storedCwdHash = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding?.cwdHash);
	if (storedCwdHash !== void 0 && storedCwdHash !== currentCwdHash) return {
		mode: "invalidate",
		invalidatedReason: "cwd"
	};
	const storedMcpResumeHash = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding?.mcpResumeHash);
	if (storedMcpResumeHash && currentMcpResumeHash) {
		if (storedMcpResumeHash !== currentMcpResumeHash) return {
			mode: "invalidate",
			invalidatedReason: "mcp"
		};
	} else if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding?.mcpConfigHash) !== currentMcpConfigHash) return {
		mode: "invalidate",
		invalidatedReason: "mcp"
	};
	const driftReasons = [];
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding?.extraSystemPromptHash) !== currentExtraSystemPromptHash) driftReasons.push("system-prompt");
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding?.promptToolNamesHash) !== currentPromptToolNamesHash) driftReasons.push("prompt-tools");
	if (driftReasons.length > 0) return {
		mode: "reuse-with-drift",
		sessionId,
		drift: { reasons: driftReasons }
	};
	return {
		mode: "reuse",
		sessionId
	};
}
//#endregion
Object.defineProperty(exports, "clearAllCliSessions", {
	enumerable: true,
	get: function() {
		return clearAllCliSessions;
	}
});
Object.defineProperty(exports, "clearCliSession", {
	enumerable: true,
	get: function() {
		return clearCliSession;
	}
});
Object.defineProperty(exports, "hashCliSessionText", {
	enumerable: true,
	get: function() {
		return hashCliSessionText;
	}
});
Object.defineProperty(exports, "resolveCliSessionReuse", {
	enumerable: true,
	get: function() {
		return resolveCliSessionReuse;
	}
});
Object.defineProperty(exports, "setCliSessionBinding", {
	enumerable: true,
	get: function() {
		return setCliSessionBinding;
	}
});
Object.defineProperty(exports, "setCliSessionId", {
	enumerable: true,
	get: function() {
		return setCliSessionId;
	}
});
