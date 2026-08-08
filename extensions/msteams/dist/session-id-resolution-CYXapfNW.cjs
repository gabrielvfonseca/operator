const require_session_key = require("./session-key-BQFkCTNx.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/sessions/session-id-resolution.ts
function compareNormalizedUpdatedAtDescending(a, b) {
	return (b.entry?.updatedAt ?? 0) - (a.entry?.updatedAt ?? 0);
}
function compareStoreKeys(a, b) {
	return a < b ? -1 : a > b ? 1 : 0;
}
function normalizeSessionIdMatches(matches, normalizedSessionId) {
	return matches.map(([sessionKey, entry]) => {
		const normalizedSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(sessionKey);
		const normalizedRequestKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_session_key.toAgentRequestSessionKey(sessionKey) ?? sessionKey);
		return {
			sessionKey,
			entry,
			normalizedSessionKey,
			normalizedRequestKey,
			isCanonicalSessionKey: sessionKey === normalizedSessionKey,
			isStructural: normalizedSessionKey.endsWith(`:${normalizedSessionId}`) || normalizedRequestKey === normalizedSessionId || normalizedRequestKey.endsWith(`:${normalizedSessionId}`)
		};
	});
}
function collapseAliasMatches(matches) {
	const grouped = /* @__PURE__ */ new Map();
	for (const match of matches) {
		const bucket = grouped.get(match.normalizedRequestKey);
		if (bucket) bucket.push(match);
		else grouped.set(match.normalizedRequestKey, [match]);
	}
	return Array.from(grouped.values(), (group) => {
		if (group.length === 1) return (0, _gabrielvfonseca_normalization_core.expectDefined)(group[0], "normalized session id match");
		return (0, _gabrielvfonseca_normalization_core.expectDefined)([...group].toSorted((a, b) => {
			const timeDiff = compareNormalizedUpdatedAtDescending(a, b);
			if (timeDiff !== 0) return timeDiff;
			if (a.isCanonicalSessionKey !== b.isCanonicalSessionKey) return a.isCanonicalSessionKey ? -1 : 1;
			return compareStoreKeys(a.normalizedSessionKey, b.normalizedSessionKey);
		})[0], "freshest normalized session id match");
	});
}
function selectFreshestUniqueMatch(matches) {
	if (matches.length === 1) return matches[0];
	const [freshest, secondFreshest] = [...matches].toSorted(compareNormalizedUpdatedAtDescending);
	if ((freshest?.entry?.updatedAt ?? 0) > (secondFreshest?.entry?.updatedAt ?? 0)) return freshest;
}
function resolveSessionIdMatchSelection(matches, sessionId) {
	if (matches.length === 0) return { kind: "none" };
	const canonicalMatches = collapseAliasMatches(normalizeSessionIdMatches(matches, (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(sessionId)));
	if (canonicalMatches.length === 1) return {
		kind: "selected",
		sessionKey: (0, _gabrielvfonseca_normalization_core.expectDefined)(canonicalMatches[0], "canonical matches capture group 0").sessionKey
	};
	const structuralMatches = canonicalMatches.filter((match) => match.isStructural);
	const selectedStructuralMatch = selectFreshestUniqueMatch(structuralMatches);
	if (selectedStructuralMatch) return {
		kind: "selected",
		sessionKey: selectedStructuralMatch.sessionKey
	};
	if (structuralMatches.length > 1) return {
		kind: "ambiguous",
		sessionKeys: structuralMatches.map((match) => match.sessionKey)
	};
	const selectedCanonicalMatch = selectFreshestUniqueMatch(canonicalMatches);
	if (selectedCanonicalMatch) return {
		kind: "selected",
		sessionKey: selectedCanonicalMatch.sessionKey
	};
	return {
		kind: "ambiguous",
		sessionKeys: canonicalMatches.map((match) => match.sessionKey)
	};
}
function resolvePreferredSessionKeyForSessionIdMatches(matches, sessionId) {
	const selection = resolveSessionIdMatchSelection(matches, sessionId);
	return selection.kind === "selected" ? selection.sessionKey : void 0;
}
//#endregion
Object.defineProperty(exports, "resolvePreferredSessionKeyForSessionIdMatches", {
	enumerable: true,
	get: function() {
		return resolvePreferredSessionKeyForSessionIdMatches;
	}
});
Object.defineProperty(exports, "resolveSessionIdMatchSelection", {
	enumerable: true,
	get: function() {
		return resolveSessionIdMatchSelection;
	}
});
