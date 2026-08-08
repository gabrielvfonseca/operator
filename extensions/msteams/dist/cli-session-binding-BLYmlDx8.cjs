let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/config/sessions/cli-session-binding.ts
const CLAUDE_CLI_BACKEND_ID = "claude-cli";
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/;
function normalizeCliSessionReseedReceipt(value) {
	const promptHash = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value?.promptHash);
	const localSessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value?.localSessionId);
	const userTurnDisposition = value?.userTurnDisposition;
	if (value?.version !== 1 || !promptHash || !SHA256_HEX_PATTERN.test(promptHash) || !localSessionId || userTurnDisposition !== "persisted" && userTurnDisposition !== "omitted") return;
	return {
		version: 1,
		promptHash,
		localSessionId,
		userTurnDisposition
	};
}
/**
* Re-own omitted reseed receipts when a reset intentionally preserves the
* native CLI conversation. Persisted turns keep their old owner and fail open
* because their canonical user row belongs to the archived local transcript.
*/
function rebindCliSessionReseedReceiptsForReset(bindings, localSessionId) {
	const normalizedLocalSessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(localSessionId);
	if (!bindings || !normalizedLocalSessionId) return bindings;
	let rebound;
	for (const [provider, binding] of Object.entries(bindings)) {
		const receipt = normalizeCliSessionReseedReceipt(binding.reseedReceipt);
		if (receipt?.userTurnDisposition !== "omitted") continue;
		rebound ??= { ...bindings };
		rebound[provider] = {
			...binding,
			reseedReceipt: {
				...receipt,
				localSessionId: normalizedLocalSessionId
			}
		};
	}
	return rebound ?? bindings;
}
/** Read the stored CLI session binding for a provider, including legacy Claude state. */
function getCliSessionBinding(entry, provider) {
	if (!entry) return;
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	const fromBindings = entry.cliSessionBindings?.[normalized];
	const bindingSessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fromBindings?.sessionId);
	if (bindingSessionId) return {
		sessionId: bindingSessionId,
		...fromBindings?.forceReuse === true ? { forceReuse: true } : {},
		...fromBindings?.forkNextResume === true ? { forkNextResume: true } : {},
		authProfileId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fromBindings?.authProfileId),
		authEpoch: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fromBindings?.authEpoch),
		authEpochVersion: fromBindings?.authEpochVersion,
		extraSystemPromptHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fromBindings?.extraSystemPromptHash),
		messageToolPolicyHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fromBindings?.messageToolPolicyHash),
		promptToolNamesHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fromBindings?.promptToolNamesHash),
		cwdHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fromBindings?.cwdHash),
		mcpConfigHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fromBindings?.mcpConfigHash),
		mcpResumeHash: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fromBindings?.mcpResumeHash),
		reseedReceipt: normalizeCliSessionReseedReceipt(fromBindings?.reseedReceipt)
	};
	const fromMap = entry.cliSessionIds?.[normalized];
	const normalizedFromMap = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fromMap);
	if (normalizedFromMap) return { sessionId: normalizedFromMap };
	if (normalized === CLAUDE_CLI_BACKEND_ID) {
		const legacy = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.claudeCliSessionId);
		if (legacy) return { sessionId: legacy };
	}
}
/** Read just the reusable CLI session ID for a provider. */
function getCliSessionId(entry, provider) {
	return getCliSessionBinding(entry, provider)?.sessionId;
}
//#endregion
Object.defineProperty(exports, "getCliSessionBinding", {
	enumerable: true,
	get: function() {
		return getCliSessionBinding;
	}
});
Object.defineProperty(exports, "getCliSessionId", {
	enumerable: true,
	get: function() {
		return getCliSessionId;
	}
});
Object.defineProperty(exports, "normalizeCliSessionReseedReceipt", {
	enumerable: true,
	get: function() {
		return normalizeCliSessionReseedReceipt;
	}
});
Object.defineProperty(exports, "rebindCliSessionReseedReceiptsForReset", {
	enumerable: true,
	get: function() {
		return rebindCliSessionReseedReceiptsForReset;
	}
});
