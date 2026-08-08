const require_web_tools = require("./web-tools-fb2XR9TB.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_session_id_resolution = require("./session-id-resolution-CYXapfNW.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/sessions-resolve.ts
function resolveSessionVisibilityFilterOptions(p) {
	return {
		includeGlobal: p.includeGlobal === true,
		includeUnknown: p.includeUnknown === true,
		spawnedBy: p.spawnedBy,
		agentId: p.agentId
	};
}
function noSessionFoundResult(params) {
	if (params.p.allowMissing) return {
		ok: true,
		missing: true
	};
	return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, params.message)
	};
}
/** Rejects sessions whose owning agent no longer exists in config (#65524). */
function validateSessionAgentExists(cfg, key, entry, options) {
	const deletedAgentId = require_session_utils.resolveDeletedAgentIdFromSessionKey(cfg, key, entry, options);
	if (deletedAgentId === null) return null;
	return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Agent "${deletedAgentId}" no longer exists in configuration`)
	};
}
function isResolvedSessionKeyVisible(params) {
	if (typeof params.p.spawnedBy !== "string" || params.p.spawnedBy.trim().length === 0) return true;
	return require_session_utils.filterAndSortSessionEntries({
		cfg: params.cfg,
		store: params.store,
		now: Date.now(),
		opts: resolveSessionVisibilityFilterOptions(params.p)
	}).some(([key]) => key === params.key);
}
function findVisibleSessionIdMatches(params) {
	const now = Date.now();
	return require_session_utils.filterAndSortSessionEntries({
		cfg: params.cfg,
		store: params.store,
		now,
		opts: resolveSessionVisibilityFilterOptions(params.p)
	}).filter(([key, entry]) => entry?.sessionId === params.sessionId || key === params.sessionId);
}
async function resolveSessionKeyFromResolveParams(params) {
	const { cfg, p } = params;
	const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(p.key) ?? "";
	const hasKey = key.length > 0;
	const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(p.sessionId) ?? "";
	const hasSessionId = sessionId.length > 0;
	const selectionCount = [
		hasKey,
		hasSessionId,
		((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(p.label) ?? "").length > 0
	].filter(Boolean).length;
	if (selectionCount > 1) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "Provide either key, sessionId, or label (not multiple)")
	};
	if (selectionCount === 0) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "Either key, sessionId, or label is required")
	};
	if (hasKey) {
		const target = require_session_utils.resolveGatewaySessionStoreTargetWithStore({
			cfg,
			key,
			clone: false
		});
		const store = target.store;
		if (store[target.canonicalKey]) {
			if (!isResolvedSessionKeyVisible({
				cfg,
				p,
				store,
				key: target.canonicalKey
			})) return noSessionFoundResult({
				p,
				message: `No session found: ${key}`
			});
			const agentCheck = validateSessionAgentExists(cfg, target.canonicalKey, store[target.canonicalKey], { acpMetadataSessionKey: target.canonicalKey });
			if (agentCheck) return agentCheck;
			return {
				ok: true,
				key: target.canonicalKey
			};
		}
		if (!target.storeKeys.find((candidate) => store[candidate])) return noSessionFoundResult({
			p,
			message: `No session found: ${key}`
		});
		await require_session_accessor.canonicalizeSessionEntryAliases({
			storePath: target.storePath,
			target: {
				canonicalKey: target.canonicalKey,
				storeKeys: target.storeKeys
			}
		});
		const refreshedTarget = require_session_utils.resolveGatewaySessionStoreTargetWithStore({
			cfg,
			key: target.canonicalKey,
			clone: false
		});
		if (!isResolvedSessionKeyVisible({
			cfg,
			p,
			store: refreshedTarget.store,
			key: refreshedTarget.canonicalKey
		})) return noSessionFoundResult({
			p,
			message: `No session found: ${key}`
		});
		const agentCheckLegacy = validateSessionAgentExists(cfg, refreshedTarget.canonicalKey, refreshedTarget.store[refreshedTarget.canonicalKey], { acpMetadataSessionKey: refreshedTarget.canonicalKey });
		if (agentCheckLegacy) return agentCheckLegacy;
		return {
			ok: true,
			key: refreshedTarget.canonicalKey
		};
	}
	if (hasSessionId) {
		const { store } = require_sessions.loadCombinedSessionStoreForGateway(cfg, { agentId: p.agentId });
		const matches = findVisibleSessionIdMatches({
			cfg,
			store,
			p,
			sessionId
		});
		const selection = require_session_id_resolution.resolveSessionIdMatchSelection(matches, sessionId);
		if (selection.kind === "none") return noSessionFoundResult({
			p,
			message: `No session found: ${sessionId}`
		});
		if (selection.kind === "ambiguous") {
			const keys = selection.sessionKeys.join(", ");
			return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Multiple sessions found for sessionId: ${sessionId} (${keys})`)
			};
		}
		const selectedEntry = matches.find(([matchKey]) => matchKey === selection.sessionKey)?.[1];
		const agentCheckSessionId = validateSessionAgentExists(cfg, selection.sessionKey, selectedEntry);
		if (agentCheckSessionId) return agentCheckSessionId;
		return {
			ok: true,
			key: selection.sessionKey
		};
	}
	const parsedLabel = require_web_tools.parseSessionLabel(p.label);
	if (!parsedLabel.ok) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, parsedLabel.error)
	};
	const { storePath, store } = require_sessions.loadCombinedSessionStoreForGateway(cfg, { agentId: p.agentId });
	const list = require_session_utils.listSessionsFromStore({
		cfg,
		storePath,
		store,
		opts: {
			includeGlobal: p.includeGlobal === true,
			includeUnknown: p.includeUnknown === true,
			label: parsedLabel.label,
			agentId: p.agentId,
			spawnedBy: p.spawnedBy,
			limit: 2
		}
	});
	if (list.sessions.length === 0) return noSessionFoundResult({
		p,
		message: `No session found with label: ${parsedLabel.label}`
	});
	if (list.sessions.length > 1) {
		const keys = list.sessions.map((s) => s.key).join(", ");
		return {
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Multiple sessions found with label: ${parsedLabel.label} (${keys})`)
		};
	}
	const labelKey = (0, _gabrielvfonseca_normalization_core.expectDefined)(list.sessions[0], "sessions entry at 0").key;
	const agentCheckLabel = validateSessionAgentExists(cfg, labelKey, store[labelKey]);
	if (agentCheckLabel) return agentCheckLabel;
	return {
		ok: true,
		key: (0, _gabrielvfonseca_normalization_core.expectDefined)(list.sessions[0], "sessions entry at 0").key
	};
}
//#endregion
Object.defineProperty(exports, "resolveSessionKeyFromResolveParams", {
	enumerable: true,
	get: function() {
		return resolveSessionKeyFromResolveParams;
	}
});
