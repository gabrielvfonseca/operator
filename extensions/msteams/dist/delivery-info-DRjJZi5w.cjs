const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_targets = require("./targets-BCEDn-da.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/config/sessions/delivery-info.ts
function hasRoutableDeliveryContext(context) {
	return Boolean(context?.channel && context?.to);
}
/**
* Extracts the routable delivery context and thread id for a persisted session key.
*
* Thread/topic keys first try their exact store entry, then fall back to the base session when
* the thread entry has no delivery route of its own.
*/
function extractDeliveryInfo(sessionKey, options) {
	const { baseSessionKey, threadId } = require_store.parseSessionThreadInfo(sessionKey);
	if (!sessionKey || !baseSessionKey) return {
		deliveryContext: void 0,
		threadId
	};
	let deliveryContext;
	try {
		const lookup = loadDeliverySessionEntry({
			cfg: options?.cfg ?? require_io.getRuntimeConfig(),
			sessionKey,
			baseSessionKey
		});
		let entry = lookup.entry;
		let storedDeliveryContext = require_delivery_context_shared.deliveryContextFromSession(entry);
		if (!hasRoutableDeliveryContext(storedDeliveryContext) && baseSessionKey !== sessionKey) {
			entry = lookup.baseEntry;
			storedDeliveryContext = require_delivery_context_shared.deliveryContextFromSession(entry);
		}
		if (hasRoutableDeliveryContext(storedDeliveryContext)) deliveryContext = {
			channel: storedDeliveryContext.channel,
			to: storedDeliveryContext.to,
			accountId: storedDeliveryContext.accountId,
			threadId: storedDeliveryContext.threadId
		};
	} catch {}
	return {
		deliveryContext,
		threadId
	};
}
function resolveDeliveryStorePaths(cfg, agentId) {
	const paths = /* @__PURE__ */ new Set();
	paths.add(require_paths.resolveStorePath(cfg.session?.store, { agentId }));
	for (const target of require_targets.resolveAllAgentSessionStoreTargetsSync(cfg)) if (target.agentId === agentId) paths.add(target.storePath);
	return [...paths];
}
function findSessionEntryInStore(store, keys) {
	let normalizedIndex;
	let bestEntry;
	let bestUpdatedAt = 0;
	let bestRoutable = false;
	let bestExact = false;
	const acceptCandidate = (entry, isExact = false) => {
		if (!entry) return;
		const candidateRoutable = hasRoutableDeliveryContext(require_delivery_context_shared.deliveryContextFromSession(entry));
		const candidateUpdatedAt = entry.updatedAt ?? 0;
		if (!bestEntry || candidateRoutable && !bestRoutable || candidateRoutable === bestRoutable && isExact && !bestExact || candidateRoutable === bestRoutable && isExact === bestExact && candidateUpdatedAt > bestUpdatedAt) {
			bestEntry = entry;
			bestUpdatedAt = candidateUpdatedAt;
			bestRoutable = candidateRoutable;
			bestExact = isExact;
		}
	};
	for (const key of keys) {
		const trimmed = key.trim();
		const normalized = require_store.normalizeStoreSessionKey(key);
		const foldedLegacyKeys = require_store.foldedSessionKeyAliasCandidates(normalized);
		const exactKeyWins = require_session_key.requiresFoldedSessionKeyAliasProof(normalized);
		let foundRoutableCandidate = false;
		const exactEntry = store.get(normalized);
		if (exactEntry && !require_store.hasMismatchedCaseSensitiveDeliveryProof(exactEntry, normalized)) {
			foundRoutableCandidate ||= hasRoutableDeliveryContext(require_delivery_context_shared.deliveryContextFromSession(exactEntry));
			acceptCandidate(exactEntry, exactKeyWins);
		}
		for (const foldedLegacyKey of foldedLegacyKeys) {
			const foldedLegacyEntry = store.get(foldedLegacyKey);
			if (!foldedLegacyEntry || !require_store.isConfirmedLowercasedLegacyAlias(foldedLegacyEntry, normalized)) continue;
			foundRoutableCandidate ||= hasRoutableDeliveryContext(require_delivery_context_shared.deliveryContextFromSession(foldedLegacyEntry));
			acceptCandidate(foldedLegacyEntry);
		}
		const trimmedEntry = trimmed !== normalized ? store.get(trimmed) : void 0;
		if (trimmedEntry && !require_store.hasMismatchedCaseSensitiveDeliveryProof(trimmedEntry, normalized)) {
			foundRoutableCandidate ||= hasRoutableDeliveryContext(require_delivery_context_shared.deliveryContextFromSession(trimmedEntry));
			acceptCandidate(trimmedEntry);
		}
		if (trimmed !== normalized || !foundRoutableCandidate) {
			normalizedIndex ??= buildFreshestSessionEntryIndex(store);
			const freshest = normalizedIndex.get(normalized);
			if (!require_store.hasMismatchedCaseSensitiveDeliveryProof(freshest, normalized)) acceptCandidate(freshest);
			for (const foldedLegacyKey of foldedLegacyKeys) {
				const foldedFreshest = normalizedIndex.get(foldedLegacyKey);
				if (require_store.isConfirmedLowercasedLegacyAlias(foldedFreshest, normalized)) acceptCandidate(foldedFreshest);
			}
		}
	}
	return bestEntry;
}
function buildFreshestSessionEntryIndex(store) {
	const index = /* @__PURE__ */ new Map();
	for (const { sessionKey: key, entry } of store.entries()) {
		if (!entry) continue;
		const normalized = require_store.normalizeStoreSessionKey(key);
		const existing = index.get(normalized);
		const entryRoutable = hasRoutableDeliveryContext(require_delivery_context_shared.deliveryContextFromSession(entry));
		const existingRoutable = hasRoutableDeliveryContext(require_delivery_context_shared.deliveryContextFromSession(existing));
		if (!existing || entryRoutable && !existingRoutable || entryRoutable === existingRoutable && (entry.updatedAt ?? 0) > (existing.updatedAt ?? 0)) index.set(normalized, entry);
		const foldedLegacyKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalized);
		if (foldedLegacyKey === normalized || require_session_key.requiresFoldedSessionKeyAliasProof(normalized)) continue;
		const foldedExisting = index.get(foldedLegacyKey);
		const foldedExistingRoutable = hasRoutableDeliveryContext(require_delivery_context_shared.deliveryContextFromSession(foldedExisting));
		if (!foldedExisting || entryRoutable && !foldedExistingRoutable || entryRoutable === foldedExistingRoutable && (entry.updatedAt ?? 0) > (foldedExisting.updatedAt ?? 0)) index.set(foldedLegacyKey, entry);
	}
	return index;
}
function loadDeliverySessionEntry(params) {
	const canonicalKey = require_session_accessor.resolveSessionStoreKey({
		cfg: params.cfg,
		sessionKey: params.sessionKey
	});
	const canonicalBaseKey = require_session_accessor.resolveSessionStoreKey({
		cfg: params.cfg,
		sessionKey: params.baseSessionKey
	});
	const agentId = require_session_accessor.resolveSessionStoreAgentId(params.cfg, canonicalKey);
	const sessionKeys = [params.sessionKey, canonicalKey];
	const baseKeys = [params.baseSessionKey, canonicalBaseKey];
	let fallback;
	for (const storePath of resolveDeliveryStorePaths(params.cfg, agentId)) {
		const store = require_session_accessor.openSessionEntryReadView({ storePath });
		const entry = findSessionEntryInStore(store, sessionKeys);
		const baseEntry = findSessionEntryInStore(store, baseKeys);
		if (!entry && !baseEntry) continue;
		fallback ??= {
			entry,
			baseEntry
		};
		if (hasRoutableDeliveryContext(require_delivery_context_shared.deliveryContextFromSession(entry)) || hasRoutableDeliveryContext(require_delivery_context_shared.deliveryContextFromSession(baseEntry))) return {
			entry,
			baseEntry
		};
	}
	return fallback ?? {
		entry: void 0,
		baseEntry: void 0
	};
}
//#endregion
Object.defineProperty(exports, "extractDeliveryInfo", {
	enumerable: true,
	get: function() {
		return extractDeliveryInfo;
	}
});
