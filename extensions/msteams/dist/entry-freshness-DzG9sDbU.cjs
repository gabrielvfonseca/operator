const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_lifecycle = require("./lifecycle-D3m53H2V.cjs");
const require_reset = require("./reset-DL3L8VC3.cjs");
const require_cli_session_binding = require("./cli-session-binding-BLYmlDx8.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/config/sessions/entry-freshness.ts
function hasProviderOwnedSession(entry) {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.providerOverride ?? entry?.modelProvider);
	return Boolean(provider && require_cli_session_binding.getCliSessionBinding(entry, provider));
}
/** Resolves one session entry's reset freshness using the runtime lifecycle rules. */
function resolveSessionEntryResetFreshness(params) {
	const agentId = params.agentId ?? require_session_key.resolveAgentIdFromSessionKey(params.sessionKey);
	const sessionCfg = params.sessionCfg;
	const storePath = params.storePath ?? require_paths.resolveStorePath(sessionCfg?.store, {
		agentId,
		env: params.env
	});
	const entry = require_session_accessor.loadSessionEntry({
		...params,
		agentId,
		storePath
	});
	const resetType = params.resetType;
	const resetPolicy = require_reset.resolveSessionResetPolicy({
		sessionCfg,
		resetType,
		resetOverride: params.resetOverride
	});
	const lifecycleTimestamps = require_lifecycle.resolveSessionLifecycleTimestamps({
		entry,
		agentId,
		storePath
	});
	const base = {
		lifecycleTimestamps,
		resetPolicy,
		resetType
	};
	if (!entry) return {
		state: "missing",
		entry: void 0,
		freshness: void 0,
		...base
	};
	const freshness = resetPolicy.configured !== true && hasProviderOwnedSession(entry) ? { fresh: true } : require_reset.evaluateSessionFreshness({
		updatedAt: entry.updatedAt,
		sessionStartedAt: lifecycleTimestamps.sessionStartedAt,
		lastInteractionAt: lifecycleTimestamps.lastInteractionAt,
		now: params.now ?? Date.now(),
		policy: resetPolicy
	});
	return {
		state: freshness.fresh ? "fresh" : "stale",
		entry,
		freshness,
		...base
	};
}
//#endregion
Object.defineProperty(exports, "hasProviderOwnedSession", {
	enumerable: true,
	get: function() {
		return hasProviderOwnedSession;
	}
});
Object.defineProperty(exports, "resolveSessionEntryResetFreshness", {
	enumerable: true,
	get: function() {
		return resolveSessionEntryResetFreshness;
	}
});
